import { RecipeModel } from '../../module/RecipeModel';
import { Link } from "react-router-dom";
import "../../SpMake.css";

const RecipeLink = (props) => {
  return (
    <>
      <Link
        to={{
          pathname: "/RecipesInfo/" + props.model[RecipeModel.RECIPE_ID]
        }}
        className={props.className}
      >{props.model[RecipeModel.TITLE]}
      </Link>
    </>
  );
};

export default RecipeLink;