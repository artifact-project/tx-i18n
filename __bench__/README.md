tx-i18n: Benchmarks
-------------------


```
Start: render(en)
-----------------
 - react-i18next x 14,820 ops/sec ±1.75% (59 runs sampled)
 - react-intl x 23,156 ops/sec ±1.97% (62 runs sampled)
 - tx-i18n x 72,810 ops/sec ±1.19% (63 runs sampled)
-----------------
Fastest is tx-i18n



Start: render(ru)
-----------------
 - react-i18next x 14,353 ops/sec ±1.23% (62 runs sampled)
 - react-intl x 23,151 ops/sec ±1.51% (61 runs sampled)
 - tx-i18n x 70,378 ops/sec ±1.60% (63 runs sampled)
-----------------
Fastest is tx-i18n



Start: switchLang()
-----------------
 - react-i18next x 4,577 ops/sec ±2.51% (59 runs sampled)
 - react-intl x 19,846 ops/sec ±1.49% (62 runs sampled)
 - tx-i18n x 53,847 ops/sec ±1.33% (62 runs sampled)
-----------------
Fastest is tx-i18n
```