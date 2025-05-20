import { getServerSideSitemap } from 'next-sitemap';
import axios from 'axios';
import type { ISitemapField } from 'next-sitemap';

interface Post {
  id: string | number;
  updatedAt?: string;
  createdAt: string;
}

export async function GET() {
  try {
    // You would replace this with your actual API endpoint to fetch dynamic content
    // For example, fetching blog posts, profiles, or other dynamic content
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts` || 'http://localhost:3000/api/posts');
    
    const posts = Array.isArray(response.data) ? response.data : [];
    
    // Create entries for your dynamic pages
    const fields: ISitemapField[] = posts.map((post: Post) => ({
      loc: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alerts.tourprism.com'}/feed/${post.id}`,
      lastmod: new Date(post.updatedAt || post.createdAt).toISOString(),
      // Optional: add changefreq and priority fields if needed
      changefreq: 'daily' as const,
      priority: 0.7,
    }));
    
    // Add any other dynamic pages you need in your sitemap
    // For example, user profiles
    // const userResponse = await axios.get(`${process.env.API_URL}/api/users`);
    // const userFields = userResponse.data.map((user) => ({
    //   loc: `${process.env.SITE_URL}/profile/${user.id}`,
    //   lastmod: new Date().toISOString(),
    // }));
    
    // Return the sitemap XML
    return getServerSideSitemap(fields);
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    
    // Return an empty sitemap if there's an error
    return getServerSideSitemap([]);
  }
} 