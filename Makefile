dev: export FLASK_ENV=development
dev:
	herokupy bin/herokuapp.py

demo:
	rsync --exclude .git -av --delete-after ./ fredc@simcoe.lmi.net:~/www.fredcallaway.com/docs/expdemo/blocks
	echo https://www.fredcallaway.com/expdemo/blocks