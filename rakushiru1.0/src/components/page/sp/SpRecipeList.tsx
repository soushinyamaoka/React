import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import SpHeader from './SpHeader';
import { RecipeModel } from '../../../module/RecipeModel';
import Service from '../../../module/Service';
import RecipeLinkButton from '../../ui/RecipeLink';
import { Const } from '../../../module/Const';
import "../../../SpList.css";

let modelIns: RecipeModel
let service: Service
let isNoData: boolean = false

function init() {

  modelIns = new RecipeModel().getInstance();
  service = new Service();
}
const SpRecipeList = (props) => {
  init();

  const [modelList, setModelList] = useState(modelIns.recipeList);
  const [isInit, setIsInit] = useState(false);
  const params: any = useParams();
  const keyWord = sessionStorage.getItem('keyWord');



  useEffect(() => {
    if (params.key && params.key === Const.NEW_RECIPE) {
      service.reqParam.ReqCode = "searchNewRecipe";
    } else if (params.key) {
      service.reqParam.ReqCode = "searchRecipe";
      modelIns.keyWordModel[0].Word = params.key;
      service.reqParam.Data = modelIns.keyWordModel;
    } else if (keyWord && keyWord === Const.NEW_RECIPE) {
      service.reqParam.ReqCode = "searchNewRecipe";
      // セッションから削除
      sessionStorage.removeItem('keyWord');
    } else if (keyWord) {
      service.reqParam.ReqCode = "searchRecipe";
      modelIns.keyWordModel[0].Word = keyWord;
      service.reqParam.Data = modelIns.keyWordModel;
      // セッションから削除
      sessionStorage.removeItem('keyWord');
    }
    service.searchRecipe(service.reqParam).then(res => {
      const resData = res.data.Data
      if (!resData.Recipes) {
        isNoData = true
        setIsInit(true)
      } else {
        isNoData = false
        setModelList(resData.Recipes)
        setIsInit(true)
      }
    })
  }, [])


  return (
    <>
      {(isInit) ? (
        <>
          <SpHeader />
          <section id="stockContents" className="section_common btn_fix relation_column prep_recipe section_border_bottom">
            <h2 className="title_common01">新着レシピ</h2>
            {(isNoData) ? (
              <h4 >レシピが見つかりませんでした</h4>
            ) : (
              <ul className="list_feature_link list_feature_area">
                {modelList.map((model) => (
                  <li key={model[RecipeModel.RECIPE_ID]} className="list_feature_link__item">
                    <div className="list_feature_link__thumb relation_column__thumb">
                      <Link
                        to={{
                          pathname: "/RecipesInfo/" + model[RecipeModel.RECIPE_ID]
                        }}
                      >
                        <img alt={model[RecipeModel.TITLE]} src={service.getImagePath(model[RecipeModel.IMAGE])} className="DlyImg-img" ></img>
                      </Link>
                    </div>
                    <div className="relation_column__article">
                      <RecipeLinkButton
                        model={model}
                        className="relation_column__title three-line-ellipsis"
                      ></RecipeLinkButton>
                      <div className="box-read">
                        {model[RecipeModel.INTRODUCTION]}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default SpRecipeList;
