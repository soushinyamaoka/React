import React from 'react';
import Head from "next/head";
import Header from './Header';
import Footer from './Footer';
import styles from "./LoadingPage.module.css";

const LoadingPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>コードキャンバス | オンライン学習サイト</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main className={styles.main}>
        <p>Loading...</p>
      </main>
      <Footer />
    </div>
  );
};

export default LoadingPage;
