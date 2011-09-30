// ふわふわふにゃ

enchant('');

window.onload = function() {
	// 定数(のつもりの変数)
	// タイルを並べる数(狭い幅方向。実際の画面サイズにより前後しうる)
	var TILE_COUNT_NARROW = 15;
	// FPS(ゲームスピード。多いと滑らかだが負荷が高い)
	var FPS = 30;
	// 主人公の加速度
	var FUNYA_ACCELERATION = 1.0;
	// 主人公の最高速
	var FUNYA_MAXSPEED = 20.0;
	// 入力範囲の広さ(-1～1。ただし0を除く。0に近いときびきび動く)
	var INPUT_AREA = 0.5;
	// スクロールの追随率(1.0以下の正の数)
	var SCROLL_RATE = 0.2;

	// 変数
	var horizontal;
	var width, height, narrow;
	var map_width, map_height;
	var center_x, center_y;
	var game;
	var tile_size;
	var mouse_r_x, mouse_r_y, mouse_r_on;	// リアルタイム情報(X, Y, ボタン押下)
	var mouse_x, mouse_y, mouse_on;	// フレーム中固定情報(X, Y, ボタン押下)
	var mouse_v_x, mouse_v_y, mouse_v_vel;	// 仮想空間上の情報(X, Y, 大きさ)
	var map;
	var mapData;
	var mapchip_offset;
	var funya;
	var needles;

	construct();
	game.start();

	function construct()
	{
		// サイズ設定
		horizontal = (window.innerWidth>=window.innerHeight);
		if (horizontal) {
			width = 640;
			height = 480;
		}else {
			width = 480;
			height = 640;
		}
		center_x = width/2;
		center_y = height/2;
		narrow = Math.min(width, height);
		tile_size = Math.ceil(narrow/TILE_COUNT_NARROW);
		map_width = Math.ceil(width/tile_size)+1;
		map_height = Math.ceil(height/tile_size)+1;

		// ゲームクラス
		game = new Game(width, height);
		game.preload('back.png', 'funya.png', 'needle.png');
		game.fps = FPS;

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
		mapchip_offset = 0;
		map.image = game.assets['back.png'];
		mapData = new Array();
		for (var y=0; y<map_height; y++) {
			mapData[y] = new Array();
			for (var x=0; x<map_width; x++) {
				mapData[y][x] = new_mapchip(x, y);
			}
		}
		map.loadData(mapData);
		map.v_x = map.v_y = 0.0;
		map.addEventListener(enchant.Event.RENDER, map_render);
		game.currentScene.addChild(map);

		// 主人公
		funya = new Sprite(tile_size, tile_size);
		funya.image = game.assets['funya.png'];
		funya.v_x  = funya.v_y  = 0.0;
		funya.v_vx = funya.v_vy = 0.0;
		funya.v_ax = funya.v_ay = 0.0;
		funya.acceleration = FUNYA_ACCELERATION;
		funya.friction = FUNYA_ACCELERATION/(FUNYA_ACCELERATION+FUNYA_MAXSPEED);
		funya.onmove = funya_onmove;
		funya.addEventListener(enchant.Event.RENDER, chara_render);
		game.currentScene.addChild(funya);

		// 敵
		needles = new Array();
	}

	function new_mapchip(x, y)
	{
		return Math.floor(Math.random() * 2)*2+(x+y+mapchip_offset)%2;
	}

	function enterframe(e)
	{
		updateinput();
		funya_onmove();
		scroll();
	}

	function touchstart(e)
	{
		mouse_r_x = e.x;
		mouse_r_y = e.y;
		mouse_r_on = true;
	}

	function touchmove(e)
	{
		mouse_r_x = e.x;
		mouse_r_y = e.y;
	}

	function touchend(e)
	{
		mouse_r_on = false;
	}

	function updateinput()
	{
		mouse_x = mouse_r_x;
		mouse_y = mouse_r_y;
		mouse_on = mouse_r_on;

		if (mouse_on) {
			// 仮想入力更新
			mouse_v_x = (mouse_x - center_x)/narrow/INPUT_AREA;
			mouse_v_y = (mouse_y - center_y)/narrow/INPUT_AREA;
			mouse_v_vel = Math.sqrt(mouse_v_x*mouse_v_x+mouse_v_y*mouse_v_y);
			if (mouse_v_vel>1.0) {
				// 入力値飽和
				mouse_v_x = mouse_v_x/mouse_v_vel;
				mouse_v_y = mouse_v_y/mouse_v_vel;
				mouse_v_vel = 1.0;
			}
		}else {
			mouse_v_x = 0;
			mouse_v_y = 0;
		}
	}

	function funya_onmove()
	{
		funya.v_ax = mouse_v_x*funya.acceleration;
		funya.v_ay = mouse_v_y*funya.acceleration;
		funya.v_vx = (funya.v_vx+funya.v_ax)*(1.0-funya.friction);
		funya.v_vy = (funya.v_vy+funya.v_ay)*(1.0-funya.friction);
		funya.v_x += funya.v_vx;
		funya.v_y += funya.v_vy;
	}

	function chara_render(e)
	{
		// 整数座標じゃないとにじむ！小数だとにじませるなんて規定あったっけ？
		this.x = Math.round(center_x + this.v_x - tile_size/2);
		this.y = Math.round(center_y + this.v_y - tile_size/2);
	}

	function map_render(e)
	{
		// 整数座標じゃないとにじむ！小数だとにじませるなんて規定あったっけ？
		this.x = Math.round(this.v_x);
		this.y = Math.round(this.v_y);
	}

	function scroll()
	{
		var s_x = funya.v_x*SCROLL_RATE;
		var s_y = funya.v_y*SCROLL_RATE;

		funya.v_x -= s_x;
		funya.v_y -= s_y;

		map.v_x -= s_x;
		map.v_y -= s_y;
		var shift_x, shift_y;
		while (true) {
			shift_x=0; shift_y=0;
			if (map.v_x>0.0) {
				shift_x = 1;
				map.v_x -= tile_size;
			}
			if (map.v_y>0.0) {
				shift_y = 1;
				map.v_y -= tile_size;
			}
			if (map.v_x<=-tile_size) {
				shift_x = -1;
				map.v_x += tile_size;
			}
			if (map.v_y<=-tile_size) {
				shift_y = -1;
				map.v_y += tile_size;
			}
			if (shift_x==0 && shift_y==0) break;
			map_shift(shift_x, shift_y);
		}
	}

	function map_shift(shift_x, shift_y)
	{
		var start_x, start_y;
		var end_x, end_y;
		var add_x, add_y;
		var x, y;
		// ループ用パラメータを設定
		if (shift_x>0) {
			start_x = map_width-1;
			end_x = 0;
		}else if (shift_x<0) {
			start_x = 0;
			end_x = map_width-1;
		}else {
			start_x = 0;
			end_x = map_width;
		}
		if (shift_y>0) {
			start_y = map_height-1;
			end_y = 0;
		}else if (shift_y<0) {
			start_y = 0;
			end_y = map_height-1;
		}else {
			start_y = 0;
			end_y = map_height;
		}
		add_x = (start_x<end_x)?(1):(-1);
		add_y = (start_y<end_y)?(1):(-1);
		// ずらす
		for (y=start_y; y!=end_y; y+=add_y) {
			for (x=start_x; x!=end_x; x+=add_x) {
				mapData[y][x] = mapData[y-shift_y][x-shift_x];
			}
		}
		// 空き領域を埋める
		if (shift_x!=0) mapchip_offset = 1-mapchip_offset;
		if (shift_y!=0) mapchip_offset = 1-mapchip_offset;
		if (shift_x!=0) {
			x = (shift_x>0)?(0):(map_width-1);
			for (y=0; y<map_height; y++) {
				mapData[y][x] = new_mapchip(x, y);
			}
		}
		if (shift_y!=0) {
			y = (shift_y>0)?(0):(map_height-1);
			for (x=0; x<map_width; x++) {
				mapData[y][x] = new_mapchip(x, y);
			}
		}
		map.loadData(mapData);
	}
};
