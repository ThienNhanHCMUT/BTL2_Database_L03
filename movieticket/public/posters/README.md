# Manual movie images

Put poster and banner files in this folder.

Then map them in:

```text
src/utils/movieImages.js
```

Example:

```js
export const MOVIE_IMAGE_OVERRIDES = {
  M_001: {
    poster: '/posters/M_001-poster.jpg',
    banner: '/posters/M_001-banner.jpg',
  },
};
```

Use the `MovieID` from SQL/backend, for example `M_001`.
