import React from 'react';
import Link from 'next/link';

type CourseCardProps = {
  imageUrl: string;
  title: string;
  description: string;
  link: string;
};

const CourseCard = ({ imageUrl, title, description, link }: CourseCardProps) => {
  return (
    <div className="course-card">
      <Link href={link}>
        {/* <img src={imageUrl} alt={title} /> */}
        <h2 className="title">{title}</h2>
        <p className="description">{description}</p>
      </Link>

      <style jsx>{`
        .course-card {
          background-color: #fff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s ease-in-out;
        }

        .course-card:hover {
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
        }

        img {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .title {
          margin: 1rem;
          font-size: 1.5rem;
          color: #333;
        }

        .description {
          margin: 0 1rem 1rem;
          font-size: 1rem;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default CourseCard;
