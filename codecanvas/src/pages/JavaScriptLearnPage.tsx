import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from "./JavaScriptLearnPage.module.css";
import AnswerCard from '../components/AnswerCard';
import LoadingPage from '../components/LoadingPage';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Contents {
  id: number;
  contentsId: string;
  title: string;
  subtitle: string;
  questions: Questions[];
}
interface Questions {
  id: number;
  questionId: string;
  title: string;
  question: string;
  explanation: string;
  answer: string;
}

const JavaScriptLearnPage: React.FC = () => {
  const [showAnswers, setShowAnswers] = useState<number[]>([]);

  const router = useRouter();
  let courseId = router.query.id;
  let courseLevel = router.query.level;
  let courseMenu = router.query.menu;
  const [contents, setContents] = useState<Contents | null>(null);
  useEffect(() => {
    if (!courseId) return;
    const fetchCourses = async () => {
      let response = null;
      if (courseLevel && courseMenu) {
        response = await fetch('/json/' + courseId + '/questions_' + courseMenu + '_' + courseLevel + '.json');
      } else {
        response = await fetch('/json/' + courseId + '/contents_' + courseId + '.json');
      }
      const data = await response.json();
      setContents(data);
    };
    fetchCourses();
  }, [courseId, courseLevel, courseMenu]);

  if (!contents) {
    return <LoadingPage />;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>コードキャンバス | オンライン学習サイト</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className={styles.main}>

        <h1>{contents.title}へようこそ</h1>

        <p>
          このページでは、Javaプログラミング言語の基本的なコンセプトを学ぶことができます。
        </p>

        {contents.questions.map((content: Questions) => (
          <AnswerCard
            key={content.id}
            id={content.id}
            contentsId={contents.contentsId}
            questionId={content.questionId}
            title={content.title}
            question={content.question}
            explanation={content.explanation}
            answer={content.answer}
            isAnswerVisible={showAnswers.includes(content.id)}
            onToggleAnswer={(id) => {
              if (showAnswers.includes(id)) {
                setShowAnswers(showAnswers.filter((idToCheck) => idToCheck !== id));
              } else {
                setShowAnswers([...showAnswers, id]);
              }
            }}
          />
        ))}
      </main>
      <Footer />
    </div>
  );
};

export default JavaScriptLearnPage;
