export const DEFAULT_MOVIE_POSTER = '/posters/default.svg';
export const DEFAULT_MOVIE_BANNER = '/posters/default.svg';

// Put image files in public/posters, then add paths here by MovieID.
// Example:
// M_001: {
//   poster: '/posters/M_001-poster.jpg',
//   banner: '/posters/M_001-banner.jpg',
// },
export const MOVIE_IMAGE_OVERRIDES = {
  M_001: {
    poster: '/posters/HENNT_front.jpg',
    banner: '/posters/HENNT_back.jpg',
  },
  M_002: {
    poster: '/posters/BT_front.jpg',
    banner: '/posters/BT_back.png',
  },
  M_003: {
    poster: '/posters/DBDH_front.jpg',
    banner: '/posters/DBDH_back.jpeg',
  },
  M_004: {
    poster: '/posters/Takhon_front.jpg',
    banner: '/posters/Takhon_back.png',
  },
  M_005: {
    poster: '/posters/SHLN_front.jpg',
    banner: '/posters/SHLN_back.png',
  },
  M_006: {
    poster: '/posters/QuyDuTuLuyenNguc_front.jpg',
    banner: '/posters/QuyDuTuLuyenNguc_back.png',
  },
  M_007: {
    poster: '/posters/TroChoiCuaQuy2_front.jpg',
    banner: '/posters/TroChoiCuaQuy2_back.png',
  },
  M_008: {
    poster: '/posters/CuSoc_front.jpg',
    banner: '/posters/CuSoc_back.jpg',
  },
  M_009: {
    poster: '/posters/Mario_front.png',
    banner: '/posters/Mario_back.png',
  },
  M_010: {
    poster: '/posters/AnhDuongCuaMe_front.jpg',
    banner: '/posters/AnhDuongCuaMe_back.png',
  },
  M_011: {
    poster: '/posters/PVCC_front.jpg',
    banner: '/posters/PVCC_back.png',
  },
  M_012: {
    poster: '/posters/CNKD_front.png',
    banner: '/posters/CNKD_back.jpg',
  },
  M_013: {
    poster: '/posters/QuyNhapTrang2_front.jpg',
    banner: '/posters/QuyNhapTrang2_back.png',
  },
};

function isMissingPoster(value) {
  return !value || String(value).includes('/posters/default.jpg');
}

export function applyMovieImages(movie) {
  const override = MOVIE_IMAGE_OVERRIDES[movie?.movieId] || {};
  const poster = override.poster || (isMissingPoster(movie?.poster) ? DEFAULT_MOVIE_POSTER : movie.poster);
  const banner = override.banner || (isMissingPoster(movie?.banner) ? poster : movie.banner);

  return {
    ...movie,
    poster,
    banner,
  };
}
