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
		f_x = f_y = 0.0;
		f_dx = f_dy = 0.0;
	}
};
