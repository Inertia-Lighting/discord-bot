if [[ `git status --porcelain` ]]; then
  call git pull
  call docker build --tag inertia-dicord-bot . 
  call docker-compose doown 
  call docker-compose up -d
else
  # No changes
fi