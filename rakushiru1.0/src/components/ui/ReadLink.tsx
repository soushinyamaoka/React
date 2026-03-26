import Service from '../../module/Service';
import { RecipeModel } from '../../module/RecipeModel';
import { Link } from "react-router-dom";
import { Const } from '../../module/Const';
import "../../SpMake.css";

const ReadLink = (props) => {
  return (
    <>
      <Link
        className={props.className}
        to={{
          pathname: "/RecipeList/" + Const.NEW_RECIPE
        }}
      >レシピをよむ</Link>
    </>
  );
};

export default ReadLink;