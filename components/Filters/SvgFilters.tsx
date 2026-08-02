import styles from './SvgFilters.module.scss';

/**
 * Filter definitions the whole page borrows through `filter: url(#…)`.
 * Rendered exactly once, near the top of the document.
 *
 * `dslr-sharpen` is a light unsharp kernel. It runs after the browser has
 * scaled the image down to its box, which is precisely where sharpening
 * belongs — a small tile of a mediocre file comes out crisp rather than soft.
 * The kernel sums to 1, so it changes edges without shifting exposure.
 */
export default function SvgFilters() {
  return (
    <svg className={styles.defs} aria-hidden="true" focusable="false">
      <defs>
        <filter
          id="dslr-sharpen"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feConvolveMatrix
            order="3"
            preserveAlpha="true"
            divisor="1"
            kernelMatrix="0 -0.55 0 -0.55 3.2 -0.55 0 -0.55 0"
          />
        </filter>
      </defs>
    </svg>
  );
}
