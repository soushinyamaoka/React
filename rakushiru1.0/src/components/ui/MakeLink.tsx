import Service from '../../module/Service';
import { RecipeModel } from '../../module/RecipeModel';
import { Link } from "react-router-dom";
import { Const } from '../../module/Const';
import "../../SpMake.css";

const MakeLink = (props) => {
  return (
    <>
      <Link
        className={props.className}
        to={{
          pathname: "/MakeRecipes/ "
        }}
      >レシピを作る</Link>
    </>
  );
};

export default MakeLink;