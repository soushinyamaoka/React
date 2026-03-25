import Link from 'next/link'

const AllShowLink = (props:any) => {
  return (
    <>
      <Link
        className={props.className}
        href={{
          pathname: "/RecipeList/" + props.keyWord + "/"
        }}
      >すべて見る</Link>
    </>
  );
};

export default AllShowLink;