// Header.tsx
import React from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <Link href="/">
          <h1 className={styles.title}>Code Canvas</h1>
      </Link>
      <h2 className={styles.subtitle}>プログラミング入門 - 未経験者でも楽しめる学習ガイド</h2>
    </header>
  );
};

export default Header;

