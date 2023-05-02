import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from './Courses.module.css';
import Link from 'next/link';
import LoadingPage from '../components/LoadingPage';

interface Course {
  id: number;
  title: string;
  description: string;
  link: string;
}

const Courses: React.FC = () => {
  const router = useRouter();
  let courseId = router.query.id;
  const [courses, setCourses] = useState<Course[]>([]);
  useEffect(() => {
    if (!courseId) return;
    const fetchCourses = async () => {
      const response = await fetch('/json/courses_' + courseId + '.json');
      const data = await response.json();
      setCourses(data);
    };
    fetchCourses();
  }, [courseId]);

  if (!courses) {
    return <LoadingPage />;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>カリキュラム一覧 | コードキャンバス</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />

      <main className={styles.main}>
        <h1 className={styles.title}>Java入門カリキュラム</h1>

        <div className={styles.grid}>
          {courses.map((course: Course) => (
            <div key={course.id} className={styles.card}>
              <Link href={course.link}>
                <h2>{course.title}</h2>
                <p>{course.description}</p>
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;