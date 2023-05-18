import Head from 'next/head';
import React from 'react';
import Header from '../components/Header';
import CourseCard from '../components/CourseCard';
import Footer from '../components/Footer';
import styles from './Home.module.css';

interface Course {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

const courses: Course[] = [
  {
    id: 1,
    title: 'Java入門',
    description: 'Javaの基本的な文法やオブジェクト指向の考え方を学びましょう。',
    imageUrl: '/images/java.jpg',
    link: '/Courses?id=java',
  },
  {
    id: 2,
    title: 'HTML & CSS入門',
    description: '(準備中)Webページ作成の基礎となるHTMLとCSSを学びましょう。',
    imageUrl: '/images/html-css.jpg',
    link: '/courses/html-css',
  },
  {
    id: 3,
    title: 'JavaScript基礎講座',
    description: '(準備中)Web開発に必須のJavaScriptを学びましょう。',
    imageUrl: '/images/javascript.jpg',
    link: '/Courses?id=javascript',
  },
  {
    id: 4,
    title: 'React入門',
    description: '(準備中)フロントエンド開発において必須のReactを学びましょう。',
    imageUrl: '/images/react.jpg',
    link: '/courses/react',
  },
  ,
];

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>コードキャンバス | 完全無料プログラミング学習サイト</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className={styles.main}>
        <h1 className={styles.title}>新着コース</h1>

        <div className={styles.grid}>
          {courses.map((course: Course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              description={course.description}
              imageUrl={course.imageUrl}
              link={course.link}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
