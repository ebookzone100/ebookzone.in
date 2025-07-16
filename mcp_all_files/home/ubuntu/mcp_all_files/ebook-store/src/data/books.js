const MCP_API_BASE_URL = 'https://5000-i0gb15qzft9jwsars1w2j-3e16843f.manusvm.computer/api';

export const fetchBooks = async () => {
  try {
    const response = await fetch(`${MCP_API_BASE_URL}/books`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.books.map(book => ({
      id: book.id,
      title: book.title,
      description: book.description,
      image: book.cover_image_url, // Assuming MCP provides cover image URL
      price: book.price,
      originalPrice: book.original_price || book.price, // Fallback if original_price is not set
      rating: book.average_rating || 4.5, // Default rating if not provided
      reviews: book.review_count || 0, // Default reviews if not provided
      category: book.category_name, // Assuming MCP provides category name
      tags: book.tags ? book.tags.split(',') : [], // Assuming tags are comma-separated string
      pages: book.page_count,
      publishDate: book.publication_date,
      bestseller: book.is_bestseller,
      author: book.author_name
    }));
  } catch (error) {
    console.error("Error fetching books from MCP server:", error);
    return [];
  }
};

export const fetchCategories = async () => {
  try {
    const response = await fetch(`${MCP_API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return ['All', ...data.categories.map(cat => cat.name)];
  } catch (error) {
    console.error("Error fetching categories from MCP server:", error);
    return ['All'];
  }
};

export const getBooksByCategory = async (category) => {
  const allBooks = await fetchBooks();
  if (category === 'All') return allBooks;
  return allBooks.filter(book => book.category === category);
};

export const getBestsellers = async () => {
  const allBooks = await fetchBooks();
  return allBooks.filter(book => book.bestseller);
};

export const searchBooks = async (query) => {
  const allBooks = await fetchBooks();
  const lowercaseQuery = query.toLowerCase();
  return allBooks.filter(book => 
    book.title.toLowerCase().includes(lowercaseQuery) ||
    book.description.toLowerCase().includes(lowercaseQuery) ||
    book.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

