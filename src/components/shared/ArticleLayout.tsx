import { useEffect, ReactNode } from "react";
import "../iching/iching.css";

interface ArticleLayoutProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ArticleLayout({ title, children, className = "" }: ArticleLayoutProps) {
  useEffect(() => {
    document.title = `${title} · Void Occult`;
  }, [title]);

  return (
    <div className={`iching-article-body ${className}`.trim()}>
      <a
        href="/"
        aria-label="Về trang chủ Void Occult"
        className="iching-back-button"
      >
        ← Void Occult
      </a>
      <div className="iching-wrap">
        {children}
      </div>
    </div>
  );
}
