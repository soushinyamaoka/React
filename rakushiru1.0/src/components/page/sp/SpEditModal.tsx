import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from "react-dom";
import "../../../SpMake.css";
import { RecipeModel } from '../../../module/RecipeModel';
import { Const } from '../../../module/Const';
import TitleInput from '../../ui/TitleInput';
import IntroTextarea from '../../ui/IntroTextarea';
import NameInput from '../../ui/NameInput';
import QuantityInput from '../../ui/QuantityInput';
import DetailTextarea from '../../ui/DetailTextarea';
import DeleteButton from '../../ui/DeleteButton';
import UpButton from '../../ui/UpButton';
import AddButton from '../../ui/AddButton';
import DownButton from '../../ui/DownButton';
import ServingInput from '../../ui/ServingInput';

const SpEditModal = (props) => {

  const [model, setModel] = useState(props.model);
  const [rModel, setRModel] = useState(props.rModel);
  const recipeId: string = props.recipeId;
  const refs: any = useRef(Array.from({ length: props.model.length }, a => React.createRef()));
  const rootEl = document.getElementById('root')!;
  const editTitle: string = props.editTitle;

  // 保存押下
  const saveData = () => {
    document.body.style.overflowY = "";
    for (let i = 0; i < model.length; i++) {
      model[i][RecipeModel.ORDER_NO] = i + 1
    }
    props.setModel(model);
    props.setShowModal(0);
  };

  const closeModal = () => {
    // 親画面のスクロールを使用可に戻す
    document.body.style.overflowY = "";
    props.setModel(props.model);
    if (props.showModal === Const.RECIPE_INGRE_NO) {
      props.setRModel(rModel)
    }
    props.setShowModal(0);
  };
  useEffect(() => {
    // 親画面のスクロールをロック
    document.body.style.overflowY = "hidden";
    const node: any = refs.current;
    if (node && node[0] && node[0].current) {
      // 先頭の入力エリアにフォーカス
      node[0].current.focus();
    }
  }, [])

  return (ReactDOM.createPortal(
    <>
      {(props.showModal !== 0) ? (
        // 画面表示領域中央にモーダル表示させる
        <div id="modal-window" style={{top:window.pageYOffset}}>
          <div className="edit-header" style={{top:0}}>
            <div className="edit-control">
              <button className="edit-Button edit-Button--contained ">
                <div className="edit-Button-body edit-Button-body--contained"
                  onClick={closeModal}
                >キャンセル</div>
              </button>
            </div>
            <div className="edit-item-name">
              {editTitle}
            </div>
            <div className="edit-control">
              <button className="edit-Button edit-Button--contained">
                <div className="edit-Button-body edit-Button-body--contained"
                  onClick={(e) => { saveData() }}
                >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;保存&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
              </button>
            </div>
          </div>
          <div id="edit-main" className="edit-main">
            <div id="recipe-update-form" className="recipe-update-form">

              {/* タイトルを入力 */}
              {(props.showModal === Const.RECIPE_TITLE_NO) ? (
                <TitleInput
                  className=""
                  model={model}
                  setModel={setRModel}
                ></TitleInput>
                // キャッチコピーを入力
              ) : (props.showModal === Const.RECIPE_INTRO_NO) ? (

                <IntroTextarea
                  className="disable-invalid-character"
                  model={model}
                  setModel={setRModel}
                ></IntroTextarea>
                // 材料を入力
              ) : (props.showModal === Const.RECIPE_INGRE_NO) ? (
                <>
                  <div className="ingredients">
                    <ServingInput
                      el={refs.current[0]}
                      model={rModel}
                      setModel={setRModel}
                    ></ServingInput>
                    {React.Children.toArray(model.map((ingModel, index) =>
                      <>
                        <div key={String(model[RecipeModel.ORDER_NO])} className="ingredient-container">
                          <div className="name">
                            <NameInput
                              className="text-field sortable-line-name ingredient-name-0 disable-invalid-character"
                              model={ingModel}
                              modelList={model}
                              setModel={setModel}
                              index={index}
                            ></NameInput>
                          </div>
                          <div className="quantity">
                            <QuantityInput
                              className="text-field sortable-line-quantity ingredient-quantity-0 disable-invalid-character"
                              model={ingModel}
                              modelList={model}
                              setModel={setModel}
                              index={index}
                            ></QuantityInput>
                          </div>
                        </div>
                        <div className="control-area">
                          <div className="delete-area">
                            <DeleteButton
                              model={ingModel}
                              modelList={model}
                              setModel={setModel}
                              index={index}
                            ></DeleteButton>
                          </div>
                          <div className="up-down-area">
                            <UpButton
                              model={ingModel}
                              modelList={model}
                              setModel={setModel}
                              index={index}
                            ></UpButton>
                          </div>
                          <div className="up-down-area">
                            <DownButton
                              model={ingModel}
                              modelList={model}
                              setModel={setModel}
                              index={index}
                            ></DownButton>
                          </div>
                        </div>
                      </>
                    ))}
                  </div>
                  <div className="inner">
                    <div className="navi">
                      <div className="add-area">
                        <AddButton
                          model={model}
                          setModel={setModel}
                          recipeId={recipeId}
                        ></AddButton>
                      </div>
                    </div>
                  </div>
                </>
                // 作り方を入力
              ) : (props.showModal === Const.RECIPE_INST_NO) ? (
                <>
                  <div className="instructions">
                    {React.Children.toArray(model.map((instModel, index) =>
                      <>
                        <div key={String(model[RecipeModel.ORDER_NO])} className="instructions-container">
                          <DetailTextarea
                            el={refs.current[index]}
                            className="disable-invalid-character"
                            model={instModel}
                            modelList={model}
                            setModel={setModel}
                            index={index}
                          ></DetailTextarea>
                          <div className="control-area">
                            <div className="delete-area">
                              <DeleteButton
                                model={instModel}
                                modelList={model}
                                setModel={setModel}
                                index={index}
                              ></DeleteButton>
                            </div>
                            <div className="up-down-area">
                              <UpButton
                                model={instModel}
                                modelList={model}
                                setModel={setModel}
                                index={index}
                              ></UpButton>
                            </div>
                            <div className="up-down-area">
                              <DownButton
                                model={instModel}
                                modelList={model}
                                setModel={setModel}
                                index={index}
                              ></DownButton>
                            </div>
                          </div>
                        </div>
                      </>
                    ))}
                  </div>
                  <div className="inner">
                    <div className="navi">
                      <div className="add-area">
                        <AddButton
                          model={model}
                          setModel={setModel}
                          recipeId={recipeId}
                        ></AddButton>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      ) : (
        <></>// showFlagがfalseの場合はModalは表示しない
      )}
    </>,
    rootEl)
  );
};

export default SpEditModal;