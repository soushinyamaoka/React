import React from "react";
import { Link } from "react-router-dom";
import { RecipeModel } from '../../../module/RecipeModel';
import Service from '../../../module/Service';
const Recip = (props) => {
  return (
    <div>
      <li className="PcRoot-popularRecipe" >
        <div className="PcRoot-popularRecipe--item dly-video-item-root small"  >
          <a href={props.link} className="DlyLink thumbnail-wrapper dly-video-item-thumbnail-root small" style={{ borderRadius: 8 }}  >
            <div className="DlyImg-root video-list-img"  >
              <img src={new Service().getImagePath(props.model[RecipeModel.IMAGE])} alt={props.model[RecipeModel.TITLE]} dly-img-state="loaded" className="DlyImg-img" ></img>
            </div>
          </a>
          <div className="video-list-info" >
            <div className="video-list-title" >
              <p className="dly-video-item-title-root small"  >
                <div>
                  <Link
                    to={{
                      pathname: props.link,
                      state: { recipeId: props.model[RecipeModel.RECIPE_ID] }
                    }}
                  >{props.model[RecipeModel.TITLE]}</Link></div>
              </p>
            </div>
          </div>
        </div>
      </li>
    </div>
  );
}

export default Recip;