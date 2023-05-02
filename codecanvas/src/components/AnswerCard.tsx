import React from 'react';
import { useRouter } from "next/router";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import styles from "./AnswerCard.module.css";

interface AnswerCardProps {
  id: number;
  contentsId: string;
  questionId: string;
  title: string;
  question: string;
  answer: string;
  explanation?: string;
  isAnswerVisible: boolean;
  onToggleAnswer: (id: number) => void;
}

const AnswerCard: React.FC<AnswerCardProps> = ({
  id,
  contentsId,
  questionId,
  title,
  question,
  answer,
  explanation,
  isAnswerVisible,
  onToggleAnswer,
}) => {
  const router = useRouter();
  const goToQuiz = (contentsId: string, level: string, menu: string) => {
    router.push({ pathname: '/JavaLearnPage', query: { id: contentsId, level: level, menu: menu } });
  };

  return (
    <div className={styles.question}>
      <h2>{title}</h2>
      <p>{question}</p>
      <button
        className={styles.showAnswer}
        onClick={() => {
          onToggleAnswer(id);
        }}
      >
        {isAnswerVisible ? "解答を隠す" : "解答を表示"}
      </button>
      {!explanation && (
        <>
          <button className={styles.quizButton} onClick={() => goToQuiz(contentsId, 'level1', questionId)}>
            初級問題集へ
          </button>
          <button className={styles.quizButton} onClick={() => goToQuiz(contentsId, 'level2', questionId)}>
            中級問題集へ
          </button>
          <button className={styles.quizButton} onClick={() => goToQuiz(contentsId, 'level3', questionId)}>
            上級問題集へ
          </button>
        </>
      )}
      {explanation && (
        <div
          className={`${styles.explanation} ${isAnswerVisible ? styles.show : styles.hide
            }`}
        >
          <p>{explanation}</p>
        </div>
      )}
      <div
        className={`${styles.answer} ${isAnswerVisible ? styles.show : styles.hide
          }`}
      >
        <SyntaxHighlighter language="java" style={dark}>
          {answer}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default AnswerCard;
