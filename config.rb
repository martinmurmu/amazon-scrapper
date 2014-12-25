# CONSTANTS -- FEEL FREE TO MODIFY THEM AS SUITABLE

HEROKU = false

# used for password checks
SALT = 'ama12345spy'

#CACHING = false # it doesn't work on Heroku, so i just turn it off for now
CACHING = true # !HEROKU # works on heroku as well!!

# cache files for a few hours
CACHETIME=(HEROKU ? 300 : 7200)
