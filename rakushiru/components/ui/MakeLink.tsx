import Link from 'next/link'

const MakeLink = (props: any) => {
  return (
    <>
      <Link
        className={props.className}
        href={{
          pathname: "/MakeRecipes/ "
        }}
      >レシピを作る</Link>
    </>
  );
};

export default MakeLink;