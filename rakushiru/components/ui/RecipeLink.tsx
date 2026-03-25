import { RecipeModel } from '../../module/RecipeModel';
import Link from 'next/link'

const RecipeLink = (props: any) => {
  return (
    <>
      <Link
        href={{
          pathname: "/RecipesInfo/" + props.model[RecipeModel.RECIPE_ID]
        }}
        className={props.className}
      >{props.model[RecipeModel.TITLE]}
      </Link>
    </>
  );
};

export default RecipeLink;