import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import "../../../SpHome.css";
import SpHeader from './SpHeader';
import { RecipeModel } from '../../../module/RecipeModel';
import Service from '../../../module/Service';
import RecipeLinkButton from '../../ui/RecipeLink';
import ReadLink from '../../ui/ReadLink';
import MakeLink from '../../ui/MakeLink';
import CategoryLink from '../../ui/CategoryLink';
import AllShowLink from '../../ui/AllShowLink';

let modelIns: RecipeModel
let service: Service
let isNoData: boolean = false
let keyWord1: string = ""
let keyWord2: string = ""
let keyWord3: string = ""

const Home = () => {

  modelIns = new RecipeModel().getInstance();
  service = new Service();

  const [homeModel, setHomeModel] = useState(modelIns.rankModel);
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    service.reqParam.ReqCode = "openHome";
    service.reqParam.Data = service.getKeyWord();
    service.searchRecipe(service.reqParam).then(res => {
      const resData = res.data.Data
      if (resData) {
        const rankModels = resData.RankModels
        keyWord1 = service.getKeyWord()[0].Word
        keyWord2 = service.getKeyWord()[1].Word
        keyWord3 = service.getKeyWord()[2].Word
  
        if (!rankModels.Rank1) {
          isNoData = true
          setIsInit(true)
        } else {
          isNoData = false
          setHomeModel(rankModels)
          setIsInit(true)
        }
      } else {
        isNoData = true
        setIsInit(true)
      }

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
                  <div className="SpRoot router-view"  >
                    <div className="SpRoot-topBannerWrapper" >
                      <div className="DlyImg-root"  >
                        <img src={service.getImagePath("HomeImage.jpg")} className="DlyImg-img"></img>
                      </div>
                    </div>
                    <div className="SpRoot-attentionLinkWrapper" >
                    </div>
                    <div className="SpRoot-globalNav" >
                      <CategoryLink
                        className="DlyLink SpRoot-globalNavItem"
                      ></CategoryLink>
                      <MakeLink
                        className="SpRoot-globalNavItem"
                      ></MakeLink>
                      <ReadLink
                        className="SpRoot-globalNavItem"
                      ></ReadLink>
                    </div>
                    <div className="SpRoot-popularRecipesTitle" >おすすめレシピ</div>
                    {(isNoData) ? (
                      <h4 >レシピが見つかりませんでした</h4>
                    ) : (
                      <div className="SpRoot-popularRecipes" >
                        <div className="SpRoot-popularRecipeItem" >
                          <div className="SpRoot-popularRecipeSectionTitle" >
                            <div className="SpRoot-popularRecipeWord" >
                              {keyWord1}
                            </div>
                            <div className="SpRoot-popularRecipeMore" >
                              <AllShowLink
                                keyWord={keyWord1}
                              ></AllShowLink>
                            </div>
                          </div>
                          <ul className="SpRoot-popularRecipeRecipes" >
                            {homeModel.Rank1.map((model) => (
                              <li key={model[RecipeModel.RECIPE_ID]} className="SpRoot-popularRecipe" >
                                <div className="dly-video-item-root mobile small"  >
                                  <Link
                                    to={{
                                      pathname: "/RecipesInfo/" + model[RecipeModel.RECIPE_ID]
                                    }}
                                  >
                                    <div className="DlyImg-root video-list-img"  >
                                      <img src={service.getImagePath(model[RecipeModel.IMAGE])} className="DlyImg-img" ></img>
                                    </div>
                                  </Link>
                                  <div className="video-list-info" >
                                    <div className="video-list-title" >
                                      <p className="dly-video-item-title-root mobile small"  >
                                        <RecipeLinkButton
                                          model={model}
                                        ></RecipeLinkButton>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {(!homeModel.Rank2) ? (
                          <></>
                        ) : (
                          <div className="SpRoot-popularRecipeItem" >
                            <div className="SpRoot-popularRecipeSectionTitle" >
                              <div className="SpRoot-popularRecipeWord" >
                                {keyWord2}
                              </div>
                              <div className="SpRoot-popularRecipeMore" >
                                <AllShowLink
                                  keyWord={keyWord2}
                                ></AllShowLink>
                              </div>
                            </div>
                            <ul className="SpRoot-popularRecipeRecipes" >
                              {homeModel.Rank2.map((model) => (
                                <li key={model[RecipeModel.RECIPE_ID]} className="SpRoot-popularRecipe" >
                                  <div className="dly-video-item-root mobile small"  >
                                    <Link
                                      to={{
                                        pathname: "/RecipesInfo/" + model[RecipeModel.RECIPE_ID]
                                      }}
                                    >
                                      <div className="DlyImg-root video-list-img"  >
                                        <img src={service.getImagePath(model[RecipeModel.IMAGE])} className="DlyImg-img" ></img>
                                      </div>
                                    </Link>
                                    <div className="video-list-info" >
                                      <div className="video-list-title" >
                                        <p className="dly-video-item-title-root mobile small"  >
                                          <RecipeLinkButton
                                            model={model}
                                          ></RecipeLinkButton>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(!homeModel.Rank3) ? (
                          <></>
                        ) : (
                          <div className="SpRoot-popularRecipeItem" >
                            <div className="SpRoot-popularRecipeSectionTitle" >
                              <div className="SpRoot-popularRecipeWord" >
                                {keyWord3}
                              </div>
                              <div className="SpRoot-popularRecipeMore" >
                                <AllShowLink
                                  keyWord={keyWord3}
                                ></AllShowLink>
                              </div>
                            </div>
                            <ul className="SpRoot-popularRecipeRecipes" >
                              {homeModel.Rank3.map((model) => (
                                <li key={model[RecipeModel.RECIPE_ID]} className="SpRoot-popularRecipe" >
                                  <div className="dly-video-item-root mobile small"  >
                                    <Link
                                      to={{
                                        pathname: "/RecipesInfo/" + model[RecipeModel.RECIPE_ID]
                                      }}
                                    >
                                      <div className="DlyImg-root video-list-img"  >
                                        <img src={service.getImagePath(model[RecipeModel.IMAGE])} className="DlyImg-img" ></img>
                                      </div>
                                    </Link>
                                    <div className="video-list-info" >
                                      <div className="video-list-title" >
                                        <p className="dly-video-item-title-root mobile small"  >
                                          <RecipeLinkButton
                                            model={model}
                                          ></RecipeLinkButton>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </>
      ) : (
        <></>// showFlagがfalseの場合はModalは表示しない
      )}
    </>
  );
}

export default Home;