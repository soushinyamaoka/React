import Service from '../../module/Service';
import { RecipeModel } from '../../module/RecipeModel';
import { Link } from "react-router-dom";
import { Const } from '../../module/Const';
import "../../SpMake.css";

const CategoryLink = (props) => {
  return (
    <>
      <Link
        className={props.className}
        to={{
          pathname: "/"
        }}
      >カテゴリをみる</Link>
    </>
  );
};

export default CategoryLink;