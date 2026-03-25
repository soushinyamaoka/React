
import { useState, useEffect } from 'react';
import { useParams, useHistory } from "react-router-dom";
import "../../../info.css";
import Header from './PcHeader';
import SideBar from './SideBar';
import { RecipeModel } from '../../../module/RecipeModel';
import Service from '../../../module/Service';
import EditButton from '../../ui/EditButton';

let modelIns: RecipeModel
let service: Service
let isInit: boolean = false

const PcRecipesInfo = () => {

  modelIns = new RecipeModel().getInstance();
  service = new Service();
  const [recipeModel, setRecipeModel] = useState(modelIns.recipeModel);
  const [ingredientModel, setIngredientModel] = useState(modelIns.ingredientModel);
  const [instModel, setInstModel] = useState(modelIns.instModel);
  const recipeId = sessionStorage.getItem('recipeId');

  const params: any = useParams();
  if (params.id) {
    recipeModel.RecipeId = params.id;
    modelIns.models.Recipes[0] = recipeModel
    service.reqParam.ReqCode = "recipeInfo";
    service.reqParam.Data = modelIns.models;
  } else if (recipeId) {
    // セッションに保存されている場合
    recipeModel.RecipeId = recipeId;
    modelIns.models.Recipes[0] = recipeModel
    service.reqParam.ReqCode = "recipeInfo";
    service.reqParam.Data = modelIns.models;
    // セッションから削除
    sessionStorage.removeItem('recipeId');
  }

  useEffect(() => {
    service.selectRecipe(service.reqParam).then(res => {
      const resData = res.data.Data
      isInit = true
      setIngredientModel(resData.Ingredients)
      setRecipeModel(resData.Recipes[0])
      setInstModel(resData.Instructions)
    })
  }, [])

  return (
    <>
      {(isInit) ? (
        <>
          <div className="main_app">
            <Header />
            <div className="recipe-info-wrapper">
              <div className="content-wrapper">
                <main role="main" className="main content">
                  <article className="main-video-wrapper" >
                    <article className="main-video-root main-video" >
                      <div className="video-wrapper" >
                        <div className="dly-video-root video"  >
                          <div className="clickable_image_uploader_wrapper" id="recipe_photo_wrapper">
                            <div id="recipe_image_form" className="uploader_form">
                              <img id="recipe-photo" className="uploader" src={service.getImagePath(recipeModel[RecipeModel.IMAGE])}></img>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="title-wrapper" >
                        <h1 className="recipesInfo-title" >{recipeModel[RecipeModel.TITLE]}</h1>
                      </div>
                      <p className="introduction" >{recipeModel[RecipeModel.INTRODUCTION]}</p>
                      <section className="ingredients" >
                        <h2 >材料<span className="servings" >({recipeModel[RecipeModel.SERVING]}人前)</span></h2>
                        <ul className="ingredient-list" >
                          {ingredientModel.map((model) =>
                            <li key={model[RecipeModel.ORDER_NO]} className="ingredient-list-item" >
                              <a className="DlyLink ingredient-name" >
                                {model[RecipeModel.NAME]}
                              </a>
                              <span className="ingredient-quantity-amount" >{model[RecipeModel.QUANTITY]}</span>
                            </li>
                          )}
                        </ul>
                      </section>
                      <section className="instructions" >
                        <h2 >作り方</h2>
                        <ol className="instruction-list" >
                          {instModel.map((model) =>
                            <li key={model[RecipeModel.ORDER_NO]} className="instruction-list-item" >
                              <span className="sort-order" >{model[RecipeModel.ORDER_NO]}</span>
                              <span className="content" >{model[RecipeModel.DETAIL]}</span>
                            </li>
                          )}
                        </ol>
                      </section>
                      <div className="pc-edit-control">
                      <EditButton
                          recipeId={recipeModel[RecipeModel.RECIPE_ID]}
                        ></EditButton>
                      </div>
                    </article>
                  </article>
                </main>
              </div>
              <SideBar />
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default PcRecipesInfo;