// ふわふわふにゃ

enchant('');

window.onload = function () {
	// 定数(のつもりの変数)
	// タイルを並べる数(狭い幅方向。実際の画面サイズにより前後しうる)
	var TILE_COUNT_NARROW = 15;
	// FPS(ゲームスピード。多いと滑らかだが負荷が高い)
	var FPS = 30;
	// 1フレーム中何回移動処理を行うか(当たり判定の精度が上がる)
	var FRAME_DIVISION = 3;
	// 主人公の加速度
	var FUNYA_ACCELERATION = 900.0;
	// 主人公の最高速
	var FUNYA_MAXSPEED = 600.0;
	// 入力範囲の広さ(-1～1。ただし0を除く。0に近いときびきび動く)
	var INPUT_AREA = 0.5;
	// スクロールの追随率(1.0以下の正の数)
	var SCROLL_RATE = 0.141421356;
	// 敵の加速度初期値
	var NEEDLE_ACCELERATION_FIRST = FUNYA_ACCELERATION * 0.5;
	// 敵の加速度下限
	var NEEDLE_ACCELERATION_MIN = FUNYA_ACCELERATION * 0.5;
	// 敵の加速度上限
	var NEEDLE_ACCELERATION_MAX = FUNYA_ACCELERATION * 1.2;
	// 敵の最高速度初期値
	var NEEDLE_MAXSPEED_FIRST = FUNYA_MAXSPEED * 1.5;
	// 敵の最高速度下限
	var NEEDLE_MAXSPEED_MIN = FUNYA_MAXSPEED * 0.8;
	// 敵の最高速度上限
	var NEEDLE_MAXSPEED_MAX = FUNYA_MAXSPEED * 1.5;
	// 敵の増殖時間
	var NEEDLE_INCREASE_CYCLE = 5.0;
	// 敵の進路予測開始時間
	var NEEDLE_FORECAST_START = 60.0;
	// 敵の進路予測完了時間
	var NEEDLE_FORECAST_END = 120.0;
	// スコアの表示色
	var SCORE_COLOR = 'black';
	// スコアの表示フォント
	var SCORE_FONT = 'sans-serif';
	// スコアの表示サイズ
	var SCORE_SIZE = 24;
	// メッセージの表示色
	var MESSAGE_COLOR = 'red';
	// スコアの表示フォント
	var MESSAGE_FONT = 'sans-serif';
	// メッセージの表示サイズ
	var MESSAGE_SIZE = 48;
	// 当たり判定の大きさ
	var HIT_RANGE = 16;

	// 変数
	var horizontal;
	var width, height, narrow;
	var map_width, map_height;
	var center_x, center_y;
	var game;
	var tile_size;
	var mouse_r_x, mouse_r_y, mouse_r_on;	// リアルタイム情報(X, Y, ボタン押下)
	var mouse_x, mouse_y, mouse_on, mouse_push;	// フレーム中固定情報(X, Y, ボタン押下、ボタンたった今押下)
	var mouse_v_x, mouse_v_y, mouse_v_vel;	// 仮想空間上の情報(X, Y, 大きさ)
	var map;
	var mapData;
	var mapchip_offset;
	var funya;
	var needles;
	var needleGroup;
	var score;
	var frame_time;
	var scoreLabel;
	var messageLabel;
	var running;

	construct();
	game.start();

	function construct() {
		// 定数の補正
		var innerfps = FPS * FRAME_DIVISION;
		NEEDLE_INCREASE_CYCLE = Math.ceil(NEEDLE_INCREASE_CYCLE * innerfps);
		NEEDLE_FORECAST_START = Math.ceil(NEEDLE_FORECAST_START * innerfps);
		NEEDLE_FORECAST_END = Math.ceil(NEEDLE_FORECAST_END * innerfps);
		frame_time = 1.0 / innerfps;

		// サイズ設定
		horizontal = (window.innerWidth >= window.innerHeight);
		if (horizontal) {
			width = 640;
			height = 480;
		} else {
			width = 480;
			height = 640;
		}
		center_x = width / 2;
		center_y = height / 2;
		narrow = Math.min(width, height);
		tile_size = Math.ceil(narrow / TILE_COUNT_NARROW);
		map_width = Math.ceil(width / tile_size) + 1;
		map_height = Math.ceil(height / tile_size) + 1;

		// ゲームクラス
		game = new Game(width, height);
		game.preload('back.png', 'funya.png', 'needle.png');
		game.fps = FPS;

		// イベント
		game.onload = onload;
		game.currentScene.addEventListener(enchant.Event.ENTER_FRAME, enterframe);
		game.currentScene.addEventListener(enchant.Event.TOUCH_START, touchstart);
		game.currentScene.addEventListener(enchant.Event.TOUCH_MOVE, touchmove);
		game.currentScene.addEventListener(enchant.Event.TOUCH_END, touchend);

		// 入力初期値
		mouse_push = true;
		running = false;
		score = 0;

		// 敵
		needleGroup = null;
	}

	function onload() {
		// マップ
		map = new Map(tile_size, tile_size);
		mapchip_offset = 0;
		map.image = game.assets['back.png'];
		mapData = new Array();
		for (var y = 0; y < map_height; y++) {
			mapData[y] = new Array();
			for (var x = 0; x < map_width; x++) {
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
		funya.v_x = funya.v_y = 0.0;
		funya.v_vx = funya.v_vy = 0.0;
		funya.v_ax = funya.v_ay = 0.0;
		funya.acceleration = FUNYA_ACCELERATION;
		funya.limitter = getlimitter(FUNYA_ACCELERATION, FUNYA_MAXSPEED);
		funya.onmove = funya_onmove;
		funya.addEventListener(enchant.Event.RENDER, chara_render);
		game.currentScene.addChild(funya);

		// 得点ラベル
		scoreLabel = new Label();
		scoreLabel.color = SCORE_COLOR;
		scoreLabel.font = SCORE_SIZE + 'px ' + SCORE_FONT;
		scoreLabel.text = 'Score:0';
		scoreLabel.width = width;
		scoreLabel.height = SCORE_SIZE;
		scoreLabel.x = SCORE_SIZE / 2;
		scoreLabel.y = SCORE_SIZE / 2;
		scoreLabel.addEventListener(enchant.Event.RENDER, function () { this.text = 'Score:' + score; });
		game.currentScene.addChild(scoreLabel);

		// メッセージラベル
		messageLabel = new Label();
		messageLabel.color = MESSAGE_COLOR;
		messageLabel.font = MESSAGE_SIZE + 'px ' + MESSAGE_FONT;
		messageLabel.text = 'ふわふわふにゃ';
		messageLabel.width = MESSAGE_SIZE * messageLabel.text.length;
		messageLabel.height = MESSAGE_SIZE;
		messageLabel.x = center_x - messageLabel.width / 2;
		messageLabel.y = height - messageLabel.height - MESSAGE_SIZE / 2;
		game.currentScene.addChild(messageLabel);
	}

	function startgame() {
		// 主人公
		funya.v_x = funya.v_y = 0.0;
		funya.v_vx = funya.v_vy = 0.0;
		funya.v_ax = funya.v_ay = 0.0;

		// 敵
		needles = new Array();
		needles[0] = firstneedle();
		if (needleGroup) game.currentScene.removeChild(needleGroup);
		needleGroup = new Group();
		needleGroup.addChild(needles[0]);
		game.currentScene.insertBefore(needleGroup, scoreLabel);

		score = 0;
		running = true;
		game.currentScene.removeChild(messageLabel);
	}

	function new_mapchip(x, y) {
		return Math.floor(Math.random() * 2) * 2 + (x + y + mapchip_offset) % 2;
	}

	function getlimitter(acceleration, maxspeed) {
		return 1.0 - acceleration * frame_time / (acceleration * frame_time + maxspeed);
	}

	function enterframe(e) {
		updateinput();
		if (!running) {
			if (mouse_push) {
				startgame();
				mouse_push = false;
			}
		}
		if (running) {
			for (var i = 0; i < FRAME_DIVISION; i++) {
				score++;
				if (score % NEEDLE_INCREASE_CYCLE == 0) {
					increaseneedle();
				}
				funya.onmove();
				for (var n = 0; n < needles.length; n++) {
					needles[n].onmove();
				}
				hitCheck();
				if (!running) return;
			}
			scroll();
		}
	}

	function firstneedle() {
		var needle;
		needle = new Sprite(tile_size, tile_size);
		needle.image = game.assets['needle.png'];
		var position = Math.random() * (width + height);
		if (position < width) {
			needle.v_x = position;
			needle.v_y = ((mouse_v_y == 0) ? (Math.random() < 0.5) : (mouse_v_y > 0)) ? -tile_size * 0.5 : height + tile_size * 0.5;
		} else {
			needle.v_x = ((mouse_v_x == 0) ? (Math.random() < 0.5) : (mouse_v_x > 0)) ? -tile_size * 0.5 : width + tile_size * 0.5;
			needle.v_y = position - width;
		}
		needle.v_x -= center_x;
		needle.v_y -= center_y;
		needle.v_vx = needle.v_vy = 0.0;
		needle.v_ax = needle.v_ay = 0.0;
		needle.forecast = 0.0;
		needle.acceleration = NEEDLE_ACCELERATION_FIRST;
		needle.maxspeed = NEEDLE_MAXSPEED_FIRST;
		needle.limitter = getlimitter(needle.acceleration, needle.maxspeed);
		needle.onmove = needle_onmove;
		needle.addEventListener(enchant.Event.RENDER, chara_render);
		return needle;
	}

	function increaseneedle() {
		// 初期値設定
		var new_n = needles.length;
		var rand_n = Math.floor(Math.random() * new_n);
		var new_a = NEEDLE_ACCELERATION_MIN + Math.random() * (NEEDLE_ACCELERATION_MAX - NEEDLE_ACCELERATION_MIN);
		var rand_a = NEEDLE_ACCELERATION_MIN + Math.random() * (NEEDLE_ACCELERATION_MAX - NEEDLE_ACCELERATION_MIN);
		var new_s = NEEDLE_MAXSPEED_MIN + Math.random() * (NEEDLE_MAXSPEED_MAX - NEEDLE_MAXSPEED_MIN);
		var rand_s = NEEDLE_MAXSPEED_MIN + Math.random() * (NEEDLE_MAXSPEED_MAX - NEEDLE_MAXSPEED_MIN);

		// 新キャラ追加
		needles[new_n] = new Sprite(tile_size, tile_size);
		needles[new_n].image = game.assets['needle.png'];
		needles[new_n].v_x = needles[rand_n].v_x;
		needles[new_n].v_y = needles[rand_n].v_y;
		needles[new_n].v_vx = -needles[rand_n].v_vy;
		needles[new_n].v_vy = needles[rand_n].v_vx;
		needles[new_n].v_ax = 0.0;
		needles[new_n].v_ay = 0.0;
		needles[new_n].forecast = rand_forecast();
		needles[new_n].acceleration = new_a;
		needles[new_n].maxspeed = new_s;
		needles[new_n].limitter = getlimitter(new_a, new_s);
		needles[new_n].onmove = needle_onmove;
		needles[new_n].addEventListener(enchant.Event.RENDER, chara_render);
		needleGroup.addChild(needles[new_n]);

		// 前のやつも反動で動かす
		needles[rand_n].v_vx = -needles[new_n].v_vx;
		needles[rand_n].v_vy = -needles[new_n].v_vy;
		needles[rand_n].forecast = rand_forecast();
		needles[rand_n].acceleration = rand_a;
		needles[rand_n].maxspeed = rand_s;
		needles[rand_n].limitter = getlimitter(rand_a, rand_s);
	}

	function rand_forecast() {
		if (score <= NEEDLE_FORECAST_START) return 0.0;
		if (score > NEEDLE_FORECAST_END) return Math.random();
		return Math.random() * (score - NEEDLE_FORECAST_START) / (NEEDLE_FORECAST_END - NEEDLE_FORECAST_START);
	}

	function touchstart(e) {
		mouse_r_x = e.x;
		mouse_r_y = e.y;
		mouse_r_on = true;
	}

	function touchmove(e) {
		mouse_r_x = e.x;
		mouse_r_y = e.y;
	}

	function touchend(e) {
		mouse_r_on = false;
	}

	function updateinput() {
		mouse_x = mouse_r_x;
		mouse_y = mouse_r_y;
		if (mouse_on) {
			mouse_on = mouse_r_on;
			mouse_push = false;
		} else {
			mouse_push = mouse_r_on;
			mouse_on = mouse_push;
		}

		if (mouse_on) {
			// 仮想入力更新
			mouse_v_x = (mouse_x - center_x) * 2.0 / narrow / INPUT_AREA;
			mouse_v_y = (mouse_y - center_y) * 2.0 / narrow / INPUT_AREA;
			mouse_v_vel = Math.sqrt(mouse_v_x * mouse_v_x + mouse_v_y * mouse_v_y);
			if (mouse_v_vel > 1.0) {
				// 入力値飽和
				mouse_v_x = mouse_v_x / mouse_v_vel;
				mouse_v_y = mouse_v_y / mouse_v_vel;
				mouse_v_vel = 1.0;
			}
		} else {
			mouse_v_x = 0;
			mouse_v_y = 0;
		}
	}

	function funya_onmove() {
		this.v_ax = mouse_v_x * this.acceleration;
		this.v_ay = mouse_v_y * this.acceleration;
		updateposition(this);
	}

	function needle_onmove() {
		var dx = funya.v_x - this.v_x;
		var dy = funya.v_y - this.v_y;
		var d_2 = dx * dx + dy * dy;
		if (this.forecast) {
			// 進路予測を入れる
			var arrival_time = Math.sqrt(d_2) / this.maxspeed;
			var forecast_x = funya.v_x + funya.v_vx * arrival_time * this.forecast;
			var forecast_y = funya.v_y + funya.v_vy * arrival_time * this.forecast;
			dx = forecast_x - this.v_x;
			dy = forecast_y - this.v_y;
			d_2 = dx * dx + dy * dy;
		}
		if (d_2 > 0.0) {
			this.v_ax = this.acceleration * dx / Math.sqrt(d_2);
			this.v_ay = this.acceleration * dy / Math.sqrt(d_2);
		}
		updateposition(this);
	}

	function updateposition(obj) {
		obj.v_vx = (obj.v_vx + obj.v_ax * frame_time) * obj.limitter;
		obj.v_vy = (obj.v_vy + obj.v_ay * frame_time) * obj.limitter;
		obj.v_x += obj.v_vx * frame_time;
		obj.v_y += obj.v_vy * frame_time;
	}

	function chara_render(e) {
		// 整数座標じゃないとにじむ！小数だとにじませるなんて規定あったっけ？
		this.x = Math.round(center_x + this.v_x - tile_size / 2);
		this.y = Math.round(center_y + this.v_y - tile_size / 2);
	}

	function map_render(e) {
		// 整数座標じゃないとにじむ！小数だとにじませるなんて規定あったっけ？
		this.x = Math.round(this.v_x);
		this.y = Math.round(this.v_y);
	}

	function scroll() {
		var s_x = funya.v_x * SCROLL_RATE;
		var s_y = funya.v_y * SCROLL_RATE;

		funya.v_x -= s_x;
		funya.v_y -= s_y;

		for (var n = 0; n < needles.length; n++) {
			needles[n].v_x -= s_x;
			needles[n].v_y -= s_y;
		}

		map.v_x -= s_x;
		map.v_y -= s_y;
		var shift_x, shift_y;
		while (true) {
			shift_x = 0; shift_y = 0;
			if (map.v_x > 0.0) {
				shift_x = 1;
				map.v_x -= tile_size;
			}
			if (map.v_y > 0.0) {
				shift_y = 1;
				map.v_y -= tile_size;
			}
			if (map.v_x <= -tile_size) {
				shift_x = -1;
				map.v_x += tile_size;
			}
			if (map.v_y <= -tile_size) {
				shift_y = -1;
				map.v_y += tile_size;
			}
			if (shift_x == 0 && shift_y == 0) break;
			map_shift(shift_x, shift_y);
		}
	}

	function map_shift(shift_x, shift_y) {
		var start_x, start_y;
		var end_x, end_y;
		var add_x, add_y;
		var x, y;
		// ループ用パラメータを設定
		if (shift_x > 0) {
			start_x = map_width - 1;
			end_x = 0;
		} else if (shift_x < 0) {
			start_x = 0;
			end_x = map_width - 1;
		} else {
			start_x = 0;
			end_x = map_width;
		}
		if (shift_y > 0) {
			start_y = map_height - 1;
			end_y = 0;
		} else if (shift_y < 0) {
			start_y = 0;
			end_y = map_height - 1;
		} else {
			start_y = 0;
			end_y = map_height;
		}
		add_x = (start_x < end_x) ? (1) : (-1);
		add_y = (start_y < end_y) ? (1) : (-1);
		// ずらす
		for (y = start_y; y != end_y; y += add_y) {
			for (x = start_x; x != end_x; x += add_x) {
				mapData[y][x] = mapData[y - shift_y][x - shift_x];
			}
		}
		// 空き領域を埋める
		if (shift_x != 0) mapchip_offset = 1 - mapchip_offset;
		if (shift_y != 0) mapchip_offset = 1 - mapchip_offset;
		if (shift_x != 0) {
			x = (shift_x > 0) ? (0) : (map_width - 1);
			for (y = 0; y < map_height; y++) {
				mapData[y][x] = new_mapchip(x, y);
			}
		}
		if (shift_y != 0) {
			y = (shift_y > 0) ? (0) : (map_height - 1);
			for (x = 0; x < map_width; x++) {
				mapData[y][x] = new_mapchip(x, y);
			}
		}
		map.loadData(mapData);
	}

	function hitCheck() {
		var hit = false;
		for (var n = 0; n < needles.length; n++) {
			var dx = needles[n].v_x - funya.v_x;
			var dy = needles[n].v_y - funya.v_y;
			if (dx * dx + dy * dy <= HIT_RANGE * HIT_RANGE) {
				hit = true;
				break;
			}
		}
		if (hit) {
			messageLabel.text = 'ゲームオーバー';
			messageLabel.width = MESSAGE_SIZE * messageLabel.text.length;
			messageLabel.height = MESSAGE_SIZE;
			messageLabel.x = center_x - messageLabel.width / 2;
			messageLabel.y = height - messageLabel.height - MESSAGE_SIZE / 2;
			game.currentScene.addChild(messageLabel);
			running = false;
		}
	}
};
