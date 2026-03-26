import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import Header from './PcHeader';
import SideBar from './SideBar';
import { RecipeModel } from '../../../module/RecipeModel';
import Service from '../../../module/Service';
import RecipeLinkButton from '../../ui/RecipeLink';
import { Const } from '../../../module/Const';
import "../../../SpList.css";

let modelIns: RecipeModel
let service: Service
let isNoData: boolean = false
let title: string = ""

function init() {

  modelIns = new RecipeModel().getInstance();
  service = new Service();
}
const PcRecipeList = (props) => {
  init();

  const [modelList, setModelList] = useState(modelIns.recipeList);
  const [isInit, setIsInit] = useState(false);
  const params: any = useParams();
  const keyWord = sessionStorage.getItem('keyWord');

  useEffect(() => {
    if (params.key && params.key === Const.NEW_RECIPE) {
      service.reqParam.ReqCode = "searchNewRecipe";
      title = "新着レシピ"
    } else if (params.key) {
      service.reqParam.ReqCode = "searchRecipe";
      modelIns.keyWordModel[0].Word = params.key;
      service.reqParam.Data = modelIns.keyWordModel;
      title = params.key
    } else if (keyWord && ""){
      // セッションにキーが保存されている場合
      service.reqParam.ReqCode = "searchRecipe";
      modelIns.keyWordModel[0].Word = keyWord;
      service.reqParam.Data = modelIns.keyWordModel;
      // セッションから削除
      sessionStorage.removeItem('keyWord');
    }　else if (keyWord && keyWord === Const.NEW_RECIPE){
      // セッションにキーが保存されている場合
      service.reqParam.ReqCode = "searchNewRecipe";
      title = "新着レシピ"
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
          <div className="main_app">
            <Header />
            <div className="recipe-info-wrapper">
              <section id="stockContents" className="section_common btn_fix relation_column prep_recipe section_border_bottom">
                <h2 className="title_common01">{title}</h2>
                {(isNoData) ? (
                  <h4 >レシピが見つかりませんでした</h4>
                ) : (
                  <ul className="list_feature_link list_feature_area">
                    {modelList.map((model) => (
                      <li key={model[RecipeModel.RECIPE_ID]} className="list_feature_link__item">
                          <div className="list_feature_link__thumb relation_column__thumb">
                            <img alt={model[RecipeModel.TITLE]} src={service.getImagePath(model[RecipeModel.IMAGE])} className="DlyImg-img" ></img>
                          </div>
                          <div className="relation_column__article">
                          <RecipeLinkButton
                                model={model}
                                className="relation_column__title three-line-ellipsis"
                              ></RecipeLinkButton>
                            <div className="relation_column__note">
                              <span className="relation_column__theme">
                                {model[RecipeModel.INTRODUCTION]}
                              </span>
                            </div>
                          </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <SideBar />
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default PcRecipeList;
