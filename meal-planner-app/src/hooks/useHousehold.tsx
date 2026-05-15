import { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { Household, HouseholdInvite, AppUser } from "../types";

const USERS_COL = "users";
const HOUSEHOLDS_COL = "households";
const INVITES_COL = "invites"; // invites/{email} でリアルタイム検索可能にする

type UserDoc = {
  householdId?: string;
  email: string;
  displayName: string | null;
};

export type PendingInvite = {
  householdId: string;
  householdName: string;
  invitedBy: string;
  invitedAt: string;
};

export function useHousehold(user: AppUser | null) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loadingHousehold, setLoadingHousehold] = useState(true);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);

  useEffect(() => {
    if (!user) {
      setHousehold(null);
      setPendingInvite(null);
      setLoadingHousehold(false);
      return;
    }

    let unsubHousehold: (() => void) | null = null;
    let unsubInvite: (() => void) | null = null;

    const init = async () => {
      setLoadingHousehold(true);

      // ユーザードキュメントの確認・作成
      const userRef = doc(db, USERS_COL, user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
        } satisfies UserDoc);
      }

      const userDoc = userSnap.exists() ? (userSnap.data() as UserDoc) : null;
      const householdId = userDoc?.householdId;

      // household をリアルタイム監視
      if (householdId) {
        const householdRef = doc(db, HOUSEHOLDS_COL, householdId);
        unsubHousehold = onSnapshot(householdRef, (snap) => {
          if (snap.exists()) {
            setHousehold({ id: snap.id, ...snap.data() } as Household);
          }
          setLoadingHousehold(false);
        });
      } else {
        setLoadingHousehold(false);
      }

      // 招待をリアルタイム監視（グループ所属済みでも常に監視）
      const inviteRef = doc(db, INVITES_COL, user.email);
      unsubInvite = onSnapshot(inviteRef, (snap) => {
        if (snap.exists()) {
          setPendingInvite(snap.data() as PendingInvite);
        } else {
          setPendingInvite(null);
        }
      });
    };

    init();
    return () => {
      unsubHousehold?.();
      unsubInvite?.();
    };
  }, [user]);

  /** 新しいhouseholdを作成 */
  const createHousehold = async (name: string): Promise<void> => {
    if (!user) return;
    const householdRef = doc(collection(db, HOUSEHOLDS_COL));
    const newHousehold: Omit<Household, "id"> = {
      name,
      members: [user.uid],
      invites: [],
    };
    await setDoc(householdRef, newHousehold);
    await setDoc(doc(db, USERS_COL, user.uid), { householdId: householdRef.id }, { merge: true });
    setHousehold({ id: householdRef.id, ...newHousehold });
  };

  /** 招待を承認してhouseholdに参加（既存グループから移動） */
  const joinHousehold = async (invite: PendingInvite): Promise<void> => {
    if (!user) return;

    // 既存グループから脱退
    if (household) {
      const currentRef = doc(db, HOUSEHOLDS_COL, household.id);
      await updateDoc(currentRef, {
        members: arrayRemove(user.uid),
      });
    }

    // 新グループに参加
    const newHouseholdRef = doc(db, HOUSEHOLDS_COL, invite.householdId);
    const newHouseholdSnap = await getDoc(newHouseholdRef);
    if (!newHouseholdSnap.exists()) throw new Error("グループが見つかりません");

    const newHouseholdData = { id: newHouseholdSnap.id, ...newHouseholdSnap.data() } as Household;
    const updatedInvites = newHouseholdData.invites.filter(
      (inv) => inv.email !== user.email
    );
    await updateDoc(newHouseholdRef, {
      members: arrayUnion(user.uid),
      invites: updatedInvites,
    });

    // ユーザードキュメントを更新
    await setDoc(doc(db, USERS_COL, user.uid), { householdId: invite.householdId }, { merge: true });

    // 招待ドキュメントを削除
    await deleteDoc(doc(db, INVITES_COL, user.email));

    setHousehold({ ...newHouseholdData, members: [...newHouseholdData.members, user.uid], invites: updatedInvites });
    setPendingInvite(null);
  };

  /** 招待を拒否 */
  const declineInvite = async (): Promise<void> => {
    if (!user) return;
    await deleteDoc(doc(db, INVITES_COL, user.email));
    setPendingInvite(null);
  };

  /** メールアドレスで招待を送信 */
  const inviteByEmail = async (email: string): Promise<void> => {
    if (!user || !household) return;
    const normalizedEmail = email.trim().toLowerCase();

    const invite: HouseholdInvite = {
      email: normalizedEmail,
      invitedBy: user.uid,
      invitedAt: new Date().toISOString(),
    };

    // households/{id}/invites に追加
    const householdRef = doc(db, HOUSEHOLDS_COL, household.id);
    await updateDoc(householdRef, {
      invites: arrayUnion(invite),
    });

    // invites/{email} にも書き込み（リアルタイム検索用）
    await setDoc(doc(db, INVITES_COL, normalizedEmail), {
      householdId: household.id,
      householdName: household.name,
      invitedBy: user.uid,
      invitedAt: new Date().toISOString(),
    } satisfies PendingInvite);
  };

  return {
    household,
    loadingHousehold,
    pendingInvite,
    createHousehold,
    joinHousehold,
    declineInvite,
    inviteByEmail,
  };
}
