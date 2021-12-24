import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';


import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';
import { formatDate } from '../utils/formatDate';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [pagination, setPagination] = useState<string>(
    postsPagination.next_page
  );
  const formatPosts = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: formatDate(post.first_publication_date),
    };
  });

  const [posts, setPosts] = useState<Post[]>(formatPosts);

  async function handleGetNextPagePosts(): Promise<void> {
    const response = await fetch(pagination);

    const data = await response.json();
    setPagination(data.next_page);

    const postsLoaded = data.results.map((post:Post)=>{
      return{
        ...post,
        first_publication_date: formatDate(post.first_publication_date),
      };
    });

    setPosts([...posts, ...postsLoaded])
  }

  return (
    <>
      <Head>
        <title>Home Page | spacetraveling</title>
      </Head>

      <section className={commonStyles.container}>
        <Header />

        {posts?.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a className={styles.containerPost}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div>
                <time><FiCalendar/> {post.first_publication_date}</time>
                <span>
                  <FiUser/>
                  {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}

        {pagination && (
          <button className={styles.loadMorePosts}
          onClick={handleGetNextPagePosts}>Carregar mais posts</button>
        )}
      </section>
    </>
  );
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')], {pageSize: 1,}
  );

  const results = postsResponse.results.map(post =>{
    return{
      uid: post.uid, first_publication_date: post.first_publication_date,
      data:{
        title: post.data.title, subtitle: post.data.subtitle, author:post.data.author,
      },
    };
  });

  const {next_page} = postsResponse;
  const postsPagination = {results, next_page,}

  return{ props:{postsPagination},};
};
