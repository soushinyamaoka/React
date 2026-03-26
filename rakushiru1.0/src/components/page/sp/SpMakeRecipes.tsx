import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import "../../../SpMake.css";
import config from '../../../config.json';
import Modal from "./SpEditModal";
import { RecipeModel } from '../../../module/RecipeModel';
import { Const } from '../../../module/Const';
import Service from '../../../module/Service';
import SaveButton from '../../ui/SaveButton';
import CancelButton from '../../ui/CancelButton';
const TITLE = ["", "レシピタイトル", "写真", "キャッチコピー", "材料", "作り方"]
let file: File = null!
let modalModel: any = null!
let setModalModel: any = null!

const SpMakeRecipes = () => {

  // TODO:この辺りも共通化したい
  const service: Service = new Service();
  const modelIns: RecipeModel = new RecipeModel();

  const [recipeModel, setRecipeModel] = useState(modelIns.recipeModel);
  const [ingredientModel, setIngredientModel] = useState(modelIns.ingredientModel);
  const [instModel, setInstModel] = useState(modelIns.instModel);
  const [showModal, setShowModal] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [localFile, setLocalFile] = useState("");
  const [file, setFile] = useState(null);
  const params: any = useParams();

  // レシピIDを取得
  if (params.id.length > 4) {
    recipeModel.RecipeId = params.id;
    modelIns.models.Recipes[0] = recipeModel
    service.reqParam.ReqCode = "recipeInfo";
    service.reqParam.Data = modelIns.models;
  }

  useEffect(() => {
    // レシピ情報を取得する
    if (recipeModel.RecipeId.length > 4) {
      service.selectRecipe(service.reqParam).then(res => {
        const resData = res.data.Data
        setIngredientModel(resData.Ingredients)
        setRecipeModel(resData.Recipes[0])
        setInstModel(resData.Instructions)
      })
    }
  }, [])

  const ShowModal = (modalNo: number) => {

    if (modalNo === Const.RECIPE_TITLE_NO) {
      // タイトル編集の場合
      modalModel = recipeModel
      setModalModel = setRecipeModel
    } else if (modalNo === Const.RECIPE_INTRO_NO) {
      // キャッチコピー編集の場合
      modalModel = recipeModel
      setModalModel = setRecipeModel
    } else if (modalNo === Const.RECIPE_INGRE_NO) {
      // 材料編集の場合
      modalModel = ingredientModel
      setModalModel = setIngredientModel
    } else if (modalNo === Const.RECIPE_INST_NO) {
      // 作り方編集の場合
      modalModel = instModel
      setModalModel = setInstModel
    }

    setEditTitle(TITLE[modalNo]);
    setShowModal(modalNo);
  };


  return (
    <>
      {(showModal !== 0) ? (
        <Modal
          showModal={showModal}
          setShowModal={setShowModal}
          model={modalModel}
          setModel={setModalModel}
          recipeId={recipeModel.RecipeId}
          editTitle={editTitle}
          rModel={recipeModel}
          setRModel={setRecipeModel}
        />
      ) : (
        <></>
      )}
      <div className="recipe-edit">
        <div className="recipe-edit-container" id="edit-main">
          <div className="sblock">
            {/* レシピタイトル */}
            <div className="title">{TITLE[Const.RECIPE_TITLE_NO]}</div>
            <div className="open-modal-window">
              {(!recipeModel.Title) ? (
                <div className="content description">
                  <div className="guide" onClick={(e) => { ShowModal(Const.RECIPE_TITLE_NO) }}>タップして入力する</div>
                </div>
              ) : (
                <div className="introduction">
                  <div className="guide" onClick={(e) => { ShowModal(Const.RECIPE_TITLE_NO) }}>{recipeModel.Title}</div>
                </div>
              )}
            </div>
            {/* 写真 */}
            <div className="title">{TITLE[Const.RECIPE_IMAGE]}</div>
            <div className="center content" id="update-photo">
              {(localFile) ? (
                <img width="100%" className="photo" id="recipe-main-photo" src={localFile} alt="Recipe edit placeholder"></img>
              ) : (!recipeModel.Image) ? (
                <img width="100%" className="photo" id="recipe-main-photo" src={service.getDefPath()} alt="Recipe edit placeholder"></img>
              ) : (
                <img width="100%" className="photo" id="recipe-main-photo" src={service.getImagePath(recipeModel[RecipeModel.IMAGE])} alt="Recipe edit placeholder"></img>
              )}
              <div className="recipe-photo-update-form-container center">
                <input
                  className="file-field"
                  type="file"
                  style={{ top: "-320.516px", left: 0, height: 316 }}
                  onChange={(e) => { service.onFileChange(e, setLocalFile, setFile) }}
                ></input>
              </div>
            </div>
            {/* キャッチコピー */}
            <div className="title">
              {TITLE[Const.RECIPE_INTRO_NO]}
            </div>
            <div className="open-modal-window">
              <div className="content description">
                {(!recipeModel.Introduction) ? (
                  <div className="guide" onClick={(e) => { ShowModal(Const.RECIPE_INTRO_NO) }}>タップして入力する</div>
                ) : (
                  <div className="guide" onClick={(e) => { ShowModal(Const.RECIPE_INTRO_NO) }}>{recipeModel.Introduction}</div>
                )}
              </div>
            </div>
            {/* 材料 */}
            <div className="title">
              {TITLE[Const.RECIPE_INGRE_NO]}
            </div>
            <div className="open-modal-window">
              {(ingredientModel.length === 1 && !ingredientModel[0].Name && !ingredientModel[0].Quantity) ? (
                <div className="content description">
                  <div className="guide" onClick={(e) => { ShowModal(Const.RECIPE_INGRE_NO) }}>タップして入力する</div>
                </div>
              ) : (
                <ul className="IngredientList" >
                  <div className="IngredientListItemValue" onClick={(e) => { ShowModal(Const.RECIPE_INGRE_NO) }}>{recipeModel.Serving}  人前</div>
                  {ingredientModel.map((model) =>
                    <li key={model.OrderNo} className="IngredientListItem" onClick={(e) => { ShowModal(Const.RECIPE_INGRE_NO) }}>
                      <div className="IngredientListItemValue">
                        <span className="HowListItemOrder" >{model.OrderNo}</span>
                        {model.Name}
                      </div>
                      <div className="IngredientListItemValue" >{model.Quantity}</div>
                    </li>
                  )}
                </ul>
              )}
            </div>
            {/* 作り方 */}
            <div className="title">
              {TITLE[Const.RECIPE_INST_NO]}
            </div>
            <div className="open-modal-window">
              {(instModel.length === 1 && !instModel[0].Detail) ? (
                <div className="content description">
                  <div className="guide" onClick={(e) => { ShowModal(Const.RECIPE_INST_NO) }}>タップして入力する</div>
                </div>
              ) : (
                <ul className="HowList" >
                  {instModel.map((model) =>
                    <li key={model.OrderNo} className="HowListItem" onClick={(e) => { ShowModal(Const.RECIPE_INST_NO) }}>
                      <span className="HowListItemOrder" >{model.OrderNo}</span>
                      <div className="HowListListItemBody" >{model.Detail}</div>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="finish-edit">
          <CancelButton />
          <SaveButton
            recipeModel={recipeModel}
            instModel={instModel}
            ingModel={ingredientModel}
            file={file}
          ></SaveButton>
        </div>
      </div>
    </>
  );
}

export default SpMakeRecipes;

