"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/fault";
exports.ids = ["vendor-chunks/fault"];
exports.modules = {

/***/ "(ssr)/./node_modules/fault/index.js":
/*!*************************************!*\
  !*** ./node_modules/fault/index.js ***!
  \*************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   create: () => (/* binding */ create),\n/* harmony export */   fault: () => (/* binding */ fault)\n/* harmony export */ });\n/* harmony import */ var format__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! format */ \"(ssr)/./node_modules/format/format.js\");\n// @ts-expect-error\n\n\nconst fault = Object.assign(create(Error), {\n  eval: create(EvalError),\n  range: create(RangeError),\n  reference: create(ReferenceError),\n  syntax: create(SyntaxError),\n  type: create(TypeError),\n  uri: create(URIError)\n})\n\n/**\n * Create a new `EConstructor`, with the formatted `format` as a first argument.\n *\n * @template {Error} Fault\n * @template {new (reason: string) => Fault} Class\n * @param {Class} Constructor\n */\nfunction create(Constructor) {\n  /** @type {string} */\n  // @ts-expect-error\n  FormattedError.displayName = Constructor.displayName || Constructor.name\n\n  return FormattedError\n\n  /**\n   * Create an error with a printf-like formatted message.\n   *\n   * @param {string|null} [format]\n   *   Template string.\n   * @param {...unknown} values\n   *   Values to render in `format`.\n   * @returns {Fault}\n   */\n  function FormattedError(format, ...values) {\n    /** @type {string} */\n    const reason = format ? format__WEBPACK_IMPORTED_MODULE_0__(format, ...values) : format\n    return new Constructor(reason)\n  }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZmF1bHQvaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDOEI7O0FBRXZCO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQSxjQUFjLE9BQU87QUFDckIsY0FBYywrQkFBK0I7QUFDN0MsV0FBVyxPQUFPO0FBQ2xCO0FBQ087QUFDUCxhQUFhLFFBQVE7QUFDckI7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLGFBQWE7QUFDMUI7QUFDQSxhQUFhLFlBQVk7QUFDekI7QUFDQSxlQUFlO0FBQ2Y7QUFDQTtBQUNBLGVBQWUsUUFBUTtBQUN2Qiw0QkFBNEIsbUNBQVM7QUFDckM7QUFDQTtBQUNBIiwic291cmNlcyI6WyIvVXNlcnMvYXl1c2hoL0RldmVsb3Blci9Ib2xvY3Jvbi9ub2RlX21vZHVsZXMvZmF1bHQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQHRzLWV4cGVjdC1lcnJvclxuaW1wb3J0IGZvcm1hdHRlciBmcm9tICdmb3JtYXQnXG5cbmV4cG9ydCBjb25zdCBmYXVsdCA9IE9iamVjdC5hc3NpZ24oY3JlYXRlKEVycm9yKSwge1xuICBldmFsOiBjcmVhdGUoRXZhbEVycm9yKSxcbiAgcmFuZ2U6IGNyZWF0ZShSYW5nZUVycm9yKSxcbiAgcmVmZXJlbmNlOiBjcmVhdGUoUmVmZXJlbmNlRXJyb3IpLFxuICBzeW50YXg6IGNyZWF0ZShTeW50YXhFcnJvciksXG4gIHR5cGU6IGNyZWF0ZShUeXBlRXJyb3IpLFxuICB1cmk6IGNyZWF0ZShVUklFcnJvcilcbn0pXG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGBFQ29uc3RydWN0b3JgLCB3aXRoIHRoZSBmb3JtYXR0ZWQgYGZvcm1hdGAgYXMgYSBmaXJzdCBhcmd1bWVudC5cbiAqXG4gKiBAdGVtcGxhdGUge0Vycm9yfSBGYXVsdFxuICogQHRlbXBsYXRlIHtuZXcgKHJlYXNvbjogc3RyaW5nKSA9PiBGYXVsdH0gQ2xhc3NcbiAqIEBwYXJhbSB7Q2xhc3N9IENvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGUoQ29uc3RydWN0b3IpIHtcbiAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgRm9ybWF0dGVkRXJyb3IuZGlzcGxheU5hbWUgPSBDb25zdHJ1Y3Rvci5kaXNwbGF5TmFtZSB8fCBDb25zdHJ1Y3Rvci5uYW1lXG5cbiAgcmV0dXJuIEZvcm1hdHRlZEVycm9yXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiBlcnJvciB3aXRoIGEgcHJpbnRmLWxpa2UgZm9ybWF0dGVkIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bGx9IFtmb3JtYXRdXG4gICAqICAgVGVtcGxhdGUgc3RyaW5nLlxuICAgKiBAcGFyYW0gey4uLnVua25vd259IHZhbHVlc1xuICAgKiAgIFZhbHVlcyB0byByZW5kZXIgaW4gYGZvcm1hdGAuXG4gICAqIEByZXR1cm5zIHtGYXVsdH1cbiAgICovXG4gIGZ1bmN0aW9uIEZvcm1hdHRlZEVycm9yKGZvcm1hdCwgLi4udmFsdWVzKSB7XG4gICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgY29uc3QgcmVhc29uID0gZm9ybWF0ID8gZm9ybWF0dGVyKGZvcm1hdCwgLi4udmFsdWVzKSA6IGZvcm1hdFxuICAgIHJldHVybiBuZXcgQ29uc3RydWN0b3IocmVhc29uKVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/fault/index.js\n");

/***/ })

};
;