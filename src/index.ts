declare var PIXI;
declare var gsap;
declare var window;
declare var document;
declare var Image;
declare var console;
declare var setTimeout;

init();

async function init() {
  console.log("init");

  // 画像を読み込む
  const image = new Image();
  image.src = "./img/flower.png";
  await image.decode();

  // PIXIのアプリケーションを作成する
  const app = new PIXI.Application({
    backgroundColor: 0x000000,
    resolution: window.devicePixelRatio,
    resizeTo: window,
  });
  document.body.appendChild(app.view);
  app.view.style.width = "100%";
  app.view.style.height = "100%";

  // ドットサイズの大きさ。1は等倍。
  // 1は綺麗だけど、TLの初期化に時間を要するのでやむなく倍化で。
  const DOT_SIZE = 4;

  // 画像のサイズを算出
  const imageW = image.width;
  const imageH = image.height;
  const lengthW = imageW / DOT_SIZE;
  const lengthH = imageH / DOT_SIZE;

  // パフォーマンスのためパーティクルコンテナーを利用
  const container = new PIXI.ParticleContainer(lengthW * lengthH, {
    scale: true,
    position: true,
    alpha: true,
  });
  app.stage.addChild(container);

  // テクスチャーを作成
  // テクスチャーを1枚にしていることがパフォーマンスに効果絶大
  const texture = PIXI.Texture.from(image);

  // 画像をメモリ上のcanvasに転写。ピクセル値を取得するため
  const canvas = document.createElement("canvas");
  canvas.width = imageW;
  canvas.height = imageH;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  context.drawImage(image, 0, 0);

  // ----------------------------------------------
  // パーティクルの生成
  // ----------------------------------------------
  console.log("パーティクルの生成");
  const dots = [] as any[];
  for (let i = 0; i < lengthW * lengthH; i++) {
    const x = (i % lengthW) * DOT_SIZE;
    const y = Math.floor(i / lengthW) * DOT_SIZE;

    const dotData = context.getImageData(
      // 範囲の中央を利用
      x + Math.floor(DOT_SIZE / 2),
      y + Math.floor(DOT_SIZE / 2),
      1,
      1
    );
    // 透過チャンネルを取得
    const alpha = dotData.data[3];

    // 透明だったらスプライトは作らないようにする
    if (alpha === 0) {
      continue;
    }
    // パーティクルを生成
    const dot = new PIXI.Sprite(PIXI.Texture.WHITE);
    dot.x = x;
    dot.y = y;
    dot.width = 1;
    dot.height = 1;
    dot.alpha = alpha / 255; // 元画像の透明度を適用
    container.addChild(dot);

    // 配列に保存
    dots.push(dot);
  }

  // GSAPのタイムラインを作成（各トゥイーンを集約管理するため）
  const tl = gsap.timeline({ yoyo: true });

  // 画面サイズを取得
  const stageW = app.screen.width;
  const stageH = app.screen.height;

  console.log("パーティクルの移動座標を決める");
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    // パーティクルの移動座標を決める

    const randomX = stageW * (Math.random() - 0.5);
    const randomY = stageH * (Math.random() - 0.5);

    tl.from(
      dot,
      {
        x: randomX,
        y: randomY,
        alpha: 0,
        duration: 4,
        ease: "expo.inOut",
      },
      0 // 各トゥイーンは0秒地点を開始とする
    );
  }

  // 文字コンテンツ表示
  setTimeout(() => {
    const elm = document.getElementById("target");
    elm.classList.add("active");
  }, 4000);
}

/**
 * パーティクルクラス。
 * scaleXとscaleYを制御したいためだけに用意したクラスです。
 */
class Dot extends PIXI!.Sprite {
  constructor(texture) {
    super(texture);
  }
  get scaleX() {
    return this.scale.x;
  }
  set scaleX(value) {
    this.scale.x = value;
  }
  get scaleY() {
    return this.scale.y;
  }
  set scaleY(value) {
    this.scale.y = value;
  }
  offsetIndex = -1;
}
