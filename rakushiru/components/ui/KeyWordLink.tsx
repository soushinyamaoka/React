import Service from '../../module/Service';
import { RecipeModel } from '../../module/RecipeModel';
import { Link } from "react-router-dom";
import "styles/SpMake.css
";

const KeyWordLink = (props: any) => {
  return (
    <>
      <Link
        className={props.className}
        to={{
          pathname: "/RecipeList/" + props.keyWord + "/"
        }}
      >{props.keyWord}</Link>
    </>
  );
};

export default KeyWordLink;