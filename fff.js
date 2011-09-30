// ふわふわふにゃ

enchant('');

window.onload = function() {
	var horizontal;
	var width, height;
	var map_width, map_height;
	var center_x, center_y;
	var game;
	var tile_size;
	var mouse_x, mouse_y;
	var map;
	var funya;
	var needles;

	construct();
	game.start();

	function construct() {
		// サイズ設定
		horizontal = (window.innerWidth>=window.innerHeight);
		if (horizontal) {
			width = 640;
			height = 480;
			map_width = 22;
			map_height = 17;
		}else {
			width = 480;
			height = 640;
			map_width = 17;
			map_height = 22;
		}
		center_x = width/2;
		center_y = height/2;
		tile_size = Math.floor(Math.min(width, height)/15);

		// ゲームクラス
		game = new Game(width, height);
		game.preload('back.png', 'funya.png', 'needle.png');
		game.fps = 30;

		// イベント
		game.onload = initgame;
		game.currentScene.addEventListener(enchant.Event.ENTER_FRAME, enterframe);
		game.currentScene.addEventListener(enchant.Event.TOUCH_START, touchstart);
		game.currentScene.addEventListener(enchant.Event.TOUCH_MOVE, touchmove);
		game.currentScene.addEventListener(enchant.Event.TOUCH_END, touchend);
	}

	function initgame()
	{
		// マップ
		map = new Map(tile_size, tile_size);
		map.image = game.assets['back.png'];
		var mapData = new Array();
		for (var y=0; y<map_height; y++) {
			mapData[y] = new Array();
			for (var x=0; x<map_width; x++) {
				mapData[y][x] = Math.floor(Math.random() * 2)*2+(x+y)%2;
			}
		}
		map.loadData(mapData);
		game.currentScene.addChild(map);

		// 主人公
		funya = new Sprite(32, 32);
		funya.image = game.assets['funya.png'];
		funya.v_x  = funya.v_y  = 0.0;
		funya.v_dx = funya.v_dy = 0.0;
		funya.rotation = 45;
		game.currentScene.addChild(funya);

		// 敵
		n_count = 0;
		n_x = new Array();
		n_y = new Array();
		n_dx = new Array();
		n_dy = new Array();

		map = new Map(32, 32);
	}

	function enterframe(e)
	{
		funya.rotation++;
	}

	function touchstart(e)
	{
		funya.x = e.x;
		funya.y = e.y;
	}

	function touchmove(e)
	{
		funya.x = e.x;
		funya.y = e.y;
	}

	function touchend(e)
	{
	}
};
