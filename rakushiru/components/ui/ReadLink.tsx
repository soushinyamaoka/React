import Link from 'next/link'
import { Const } from '../../module/Const';

const ReadLink = (props: any) => {
  return (
    <>
      <Link
        className={props.className}
        href={{
          pathname: "/RecipeList/" + Const.NEW_RECIPE
        }}
      >レシピをよむ</Link>
    </>
  );
};

export default ReadLink;