// ふわふわふにゃ

enchant('');

window.onload = function() {
	var game = new Game(640, 480);
	game.preload('back.png', 'main.png', 'needle.png');
	game.fps = 30;
	game.onload = function()
	{
		initgame();
	};
	game.start();
	
	function initgame()
	{
		// 主人公
		f_x = f_y = 0.0;
		f_dx = f_dy = 0.0;
		
		// 敵
		n_count = 0;
		n_x = new Array();
		n_y = new Array();
		n_dx = new Array();
		n_dy = new Array();
	}
};
