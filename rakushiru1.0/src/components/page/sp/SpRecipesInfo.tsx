import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import "../../../SpInfo.css";
import SpHeader from './SpHeader';
import { RecipeModel } from '../../../module/RecipeModel';
import Service from '../../../module/Service';
import EditButton from '../../ui/EditButton';

let modelIns: RecipeModel
let service: Service
let isInit: boolean = false

const SpRecipesInfo = () => {
  modelIns = new RecipeModel().getInstance();
  service = new Service();
  const params: any = useParams();
  const recipeId = sessionStorage.getItem('recipeId');
  if (params.id) {
    modelIns.recipeModel.RecipeId = params.id;
    service.reqParam.ReqCode = "recipeInfo";
    service.reqParam.Data = modelIns.models;
  } else if (recipeId) {
    // セッションに保存されている場合
    modelIns.recipeModel.RecipeId = recipeId;
    service.reqParam.ReqCode = "recipeInfo";
    service.reqParam.Data = modelIns.models;
    // セッションから削除
    sessionStorage.removeItem('recipeInfo');
  }

  const [recipeModel, setRecipeModel] = useState(modelIns.recipeModel);
  const [ingredientModel, setIngredientModel] = useState(modelIns.ingredientModel);
  const [instModel, setInstModel] = useState(modelIns.instModel);


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
          <SpHeader />
          <div id="wrapper">
            <div id="content">
              <div id="content-inner">
                <section id="partial_spa" className="partial-spa-root is-mobile" >
                  <div className="SpApp router-view"  >
                    <main className="SpApp-main" >
                      <div className="TitleAndIntroductionSp SpApp-titleAndIntroduction"  >
                        <div className="TitleAndIntroductionSp-title" >
                          <h1 className="TitleAndIntroductionSp-titleBody" >{recipeModel[RecipeModel.TITLE]}</h1>
                        </div>
                        <div className="TitleAndIntroductionSp-introduction" >
                          <div >
                            <div className="TitleAndIntroductionSp-introductionContent" >
                              <div>{recipeModel[RecipeModel.INTRODUCTION]}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="MainContentWta SpApp-mainContent"  >
                        <div className="RecipeDetail-metadataWrap"  >
                          <div className="DlyW2aNutrientSlideUpModal-wrapper">
                            <div className="DlyW2aNutrientSlideUpModal">
                              <div className="DlyW2aNutrientSlideUpModal-contentWrap">
                                <div className="DlyW2aNutrientSlideUpModal-nutrientWrap">
                                  <div className="image-wrapper">
                                    <img src={service.getImagePath(recipeModel[RecipeModel.IMAGE])} className="resizeimage"></img>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="MainContentWta-ingredients" >
                          <h2 className="MainContentWta-sectionTitle" >
                            <span className="MainContentWta-sectionTitleIngredients" >材料</span>
                            <span className="MainContentWta-sectionTitleIngredientsServings" >({recipeModel[RecipeModel.SERVING]}人前)</span>
                          </h2>
                          <ul className="MainContentWta-ingredientsList" >
                            {ingredientModel.map((model) =>
                              <li key={model[RecipeModel.ORDER_NO]} className="MainContentWta-ingredientsListItem" >
                                <div className="MainContentWta-ingredientsListItemValue" >
                                  <span className="MainContentWta-instructionsListItemOrder" >{model[RecipeModel.ORDER_NO]}</span>
                                  {model[RecipeModel.NAME]}
                                </div>
                                <div className="MainContentWta-ingredientsListItemValue" >{model[RecipeModel.QUANTITY]}</div>
                              </li>
                            )}
                          </ul>
                        </div>
                        <div className="MainContentWta-instructions" >
                          <span className="MainContentWta-anchorForScroll" >
                          </span>
                          <h2 className="MainContentWta-sectionTitle MainContentWta-sectionTitle--instructions" >手順</h2>
                          <ul className="MainContentWta-instructionsList" >
                            {instModel.map((model) =>
                              <li key={model[RecipeModel.ORDER_NO]} className="MainContentWta-instructionsListItem" >
                                <span className="MainContentWta-instructionsListItemOrder" >{model[RecipeModel.ORDER_NO]}</span>
                                <div className="MainContentWta-instructionsListItemBody" >{model[RecipeModel.DETAIL]}</div>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                      <div className="info-control-area">
                        <EditButton
                          recipeId={recipeModel[RecipeModel.RECIPE_ID]}
                        ></EditButton>
                      </div>
                    </main>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default SpRecipesInfo;