import Link from 'next/link'

const CategoryLink = (props:any) => {
  return (
    <>
      <Link
        className={props.className}
        href={{
          pathname: "/"
        }}
      >カテゴリをみる</Link>
    </>
  );
};

export default CategoryLink;