FROM postgres:16-alpine

COPY docker-entrypoint-repair.sh /usr/local/bin/docker-entrypoint-repair.sh

RUN chmod +x /usr/local/bin/docker-entrypoint-repair.sh

ENTRYPOINT ["docker-entrypoint-repair.sh"]
CMD ["postgres"]
