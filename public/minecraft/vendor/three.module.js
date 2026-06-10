// three.js 本体は /vendor/three.module.js に1本だけ共有配置している。
// ブラウザでは index.html の importmap がこのURLを共有先へ付け替えるので、
// このファイルは読まれない。これは node で直接 *.test.mjs を実行するときの
// 後方互換シム（再エクスポートのみ）。
export * from '../../vendor/three.module.js';
