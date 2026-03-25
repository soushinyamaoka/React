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
  link: string;
}

const courses: Course[] = [
  {
    id: 1,
    title: 'Java入門',
    description: 'Javaの基本的な文法やオブジェクト指向の考え方を学びましょう。',
    link: '/courses/java',
  },
  {
    id: 2,
    title: 'HTML & CSS入門',
    description: 'Webページ作成の基礎となるHTMLとCSSを学びましょう。',
    link: '/courses/htmlcss',
  },
  {
    id: 3,
    title: 'JavaScript基礎講座',
    description: 'Web開発に必須のJavaScriptを学びましょう。',
    link: '/courses/javascript',
  },
  {
    id: 4,
    title: 'React入門',
    description: '(準備中)フロントエンド開発において必須のReactを学びましょう。',
    link: '/courses/react',
  },
];
const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>コードキャンバス | 完全無料プログラミング学習サイト</title>
        <meta name="description" content="Code Canvasは完全無料のオンラインプログラミング学習サイトです。初心者向けのプログラミングコースを提供しています。" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className={styles.main}>
        <h2 className={styles.title}>新着コース</h2>
        <div className={styles.grid}>
          {courses.map((course: Course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              description={course.description}
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
