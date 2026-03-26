import config from '../../../config.json';
import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import "../../../Make.css";
import Header from './PcHeader';
import SideBar from './SideBar';
import { RecipeModel } from '../../../module/RecipeModel';
import Service from '../../../module/Service';
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
import SaveButton from '../../ui/SaveButton';

let file: File = null!

const PcMakeRecipes = () => {

  // TODO:この辺りも共通化したい
  const service: Service = new Service();
  const modelIns: RecipeModel = new RecipeModel();

  const [recipeModel, setRecipeModel] = useState(modelIns.recipeModel);
  const [ingredientModel, setIngredientModel] = useState(modelIns.ingredientModel);
  const [instModel, setInstModel] = useState(modelIns.instModel);
  const [localFile, setLocalFile] = useState("");
  const [file, setFile] = useState(null);
  const defaultImage = process.env.PUBLIC_URL + "/" + config.default.image;

  // レシピIDを取得
  const params: any = useParams();
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

  return (
    <div id="main_app">
      <Header />
      <div className="make-main">
        <div className="make-main-secondary">
          <div className="make-explanation-photo">
            <div className="make-explanation">
              <div className="make-recipe-inputarea input_box">
                <label>料理名</label>
                <div id="input_box">
                  <TitleInput
                    className=""
                    model={recipeModel}
                    setModel={setRecipeModel}
                  ></TitleInput>
                </div>
              </div>
              <div className="make-recipe-inputarea area_box">
                <label>キャッチコピー</label>
                <div id="area_box">
                  <IntroTextarea
                    className="editor_field"
                    model={recipeModel}
                    setModel={setRecipeModel}
                  ></IntroTextarea>
                </div>
              </div>
            </div>
            <div className="clickable_image_uploader_wrapper" data-blank-image="https://assets.cpcdn.com/assets/themes/recipe/blank.png?83b7514a3fee402c0ec13b51dee90d18adbbfd1a79b556bf060fe7735791bc2f" id="recipe_photo_wrapper">
              <div id="recipe_image_form" className="uploader_form" >
                {(localFile) ? (
                  <img alt="" id="recipe-photo" className="uploader" src={localFile}></img>
                ) : (!recipeModel.Image) ? (
                  <img alt="" id="recipe-photo" className="uploader" src={service.getDefPath()}></img>
                ) : (
                  <img alt="" id="recipe-photo" className="uploader" src={service.getImagePath(recipeModel[RecipeModel.IMAGE])}></img>
                )}
                <div className="file_holder">
                  <input
                    className="file_field uploader_input"
                    id="recipe_image_uploader"
                    size={0}
                    type="file"
                    style={{ height: 383, width: 280 }}
                    onChange={(e) => { service.onFileChange(e, setLocalFile, setFile) }}
                  ></input>
                </div>
              </div>
            </div>
          </div>
          <div className="make-material-how">
            <div className="make-material">
              <label>材料</label>
              <div className="pc-add-area">
                <AddButton
                  model={ingredientModel}
                  setModel={setIngredientModel}
                  recipeId={recipeModel.RecipeId}
                ></AddButton>
              </div>
              <ServingInput
                model={recipeModel}
                setModel={setRecipeModel}
              ></ServingInput>
              {React.Children.toArray(ingredientModel.map((model, index) =>
                <>
                  <div key={String(model[RecipeModel.ORDER_NO])} className="ingredient-container">
                    <div className="name">
                      <NameInput
                        className="text-field sortable-line-name ingredient-name-0 disable-invalid-character"
                        model={model}
                        modelList={ingredientModel}
                        setModel={setIngredientModel}
                        index={index}
                      ></NameInput>
                    </div>
                    <div className="quantity">
                      <QuantityInput
                        className="text-field sortable-line-quantity ingredient-quantity-0 disable-invalid-character"
                        model={model}
                        modelList={ingredientModel}
                        setModel={setIngredientModel}
                        index={index}
                      ></QuantityInput>
                    </div>
                  </div>
                  <div className="control-area">
                    <div className="delete-area">
                      <DeleteButton
                        model={model}
                        modelList={ingredientModel}
                        setModel={setIngredientModel}
                        index={index}
                      ></DeleteButton>
                    </div>
                    <div className="up-down-area">
                      <UpButton
                        model={model}
                        modelList={ingredientModel}
                        setModel={setIngredientModel}
                        index={index}
                      ></UpButton>
                    </div>
                    <div className="up-down-area">
                      <DownButton
                        model={model}
                        modelList={ingredientModel}
                        setModel={setIngredientModel}
                        index={index}
                      ></DownButton>
                    </div>
                  </div>
                </>
              ))}
            </div>
            <div className="pc-instructions">
              <label>作り方</label>
              <div className="pc-add-area">
                <AddButton
                  model={instModel}
                  setModel={setInstModel}
                  recipeId={recipeModel.RecipeId}
                ></AddButton>
              </div>
              {React.Children.toArray(instModel.map((model, index) =>
                <>
                  <div key={String(model[RecipeModel.ORDER_NO])} className="instructions-container">
                    <DetailTextarea
                      className="disable-invalid-character"
                      model={model}
                      modelList={instModel}
                      setModel={setInstModel}
                      index={index}
                    ></DetailTextarea>
                    <div className="control-area">
                      <div className="delete-area">
                        <DeleteButton
                          model={model}
                          modelList={instModel}
                          setModel={setInstModel}
                          index={index}
                        ></DeleteButton>
                      </div>
                      <div className="up-down-area">
                        <UpButton
                          model={model}
                          modelList={instModel}
                          setModel={setInstModel}
                          index={index}
                        ></UpButton>
                      </div>
                      <div className="up-down-area">
                        <DownButton
                          model={model}
                          modelList={instModel}
                          setModel={setInstModel}
                          index={index}
                        ></DownButton>
                      </div>
                    </div>
                  </div>
                </>))}
            </div>
          </div>
          <div className="pc-edit-control">
            <SaveButton
              recipeModel={recipeModel}
              instModel={instModel}
              ingModel={ingredientModel}
              file={file}
            ></SaveButton>
          </div>
        </div>
        <SideBar />
      </div>
    </div>
  );
}

export default PcMakeRecipes;