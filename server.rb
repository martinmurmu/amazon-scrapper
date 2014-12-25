#!/usr/bin/env ruby
# encoding: UTF-8

#require 'em/pure_ruby'
require 'sinatra'
#require 'sinatra/synchrony'
require 'logger'
require 'haml'
require 'json'
#require 'pp'

require 'fileutils'
#require 'faraday'
require 'nokogiri'
require 'net/http'
require 'open-uri'
require 'base64'
require 'digest'
require 'tmpdir'

require File.dirname(__FILE__)+'/config'
require File.dirname(__FILE__)+'/utils'
require File.dirname(__FILE__)+'/amazon'

require 'launchy'

set :environment, :production
set :dump_errors, false
set :bind, 'localhost'
set :port, port = 62934

use Rack::Session::Cookie, :expire_after => 315360000, # about ten years
                           :secret => 'verysecretthings987$*!&2222'
SILENT = false

if SILENT
  $stdout.reopen(File::NULL)
  $stderr.reopen(File::NULL)
end

configure do
  set :logging, true
  logger = Logger.new (SILENT ? File::NULL : STDERR)
  logger.level = Logger::INFO
  logger.datetime_format = '%a %d-%m-%Y %H%M '
  set :logger, logger
end


helpers do
  def logger
    settings.logger
  end

  def session_id
    session['session_id']
  end

  def logged_on?
    request.cookies['authorized'] == 'yes'
  end

  def protected!
    halt [401, 'Not Authorized'] unless logged_on?
  end

  def affiliate
    request.cookies['affiliate'] || ''
  end

  def folder
    (f = request.cookies['folder']) == '' ? nil : f
  end

  def affiliate?
    !!request.cookies['affiliate']
  end
end


get '/' do
  @domains = Amazon::SITES
  redirect '/login' unless logged_on?
  redirect '/aff'   unless affiliate?
  haml :index
end


get '/bye' do
  protected!
  Thread.new{sleep(1);Process.kill("TERM", Process.pid);}
  haml :bye
end


post '/' do
  protected!

  return {}.to_json if !params['url'] || params['url'] == ''

  url = params['url']

  ret = cache('json:'+url)
  return ret if ret

  firstpage = !url[/[?&]page=/]


  x = noko(url)

  maxresults = x.search('#resultCount span text()').to_s;

  if maxresults[' of ']
    maxresults = maxresults.gsub(/.*of /,'')
    maxpages = x.search('#pagn .pagnDisabled text()').to_s.gsub(',','')
    maxpages = x.search('#pagn .pagnLink text()').last.to_s.gsub(',','')  if maxpages == ''
    maxpages = maxpages.to_i
  else
    maxresults = maxresults.gsub(/^Showing /,'')
    maxpages = 1
  end

  # finish it off
  maxresults = maxresults.gsub(/ Res.*/,'').gsub(',','').to_i

  b = Amazon::breadcrumbs(x)[0]
  if firstpage
    refinements = Amazon::refinements(x).to_html

    sortby = Amazon::sortby(x).to_html
    breadcrumbs = b.to_html if b
  end

  products = Amazon::products(x)
  products.each{|p|p[:link] += '&tag=%s' % URI.escape(affiliate)} if affiliate?

  if b
    s = b.search('text()').to_s.gsub(/\s+/m,' ').gsub('&amp;','&').strip
    products.each{|p|p[:search] = s}
  end

  hostpart = url.match(%Q(^(https?://(www[.])?amazon[.](com|ca|co[.]uk))/))[1]

  nextpage = Amazon::nextpage(x).to_s
  nextpage = (nextpage == '' ? nil : hostpart + nextpage)

  #logger.info("finished #{url}")

  ret = { products: products, refinements: refinements, sortby: sortby, breadcrumbs: breadcrumbs, maxpages: maxpages, maxresults: maxresults, request:params, scraped:url, nextpage:nextpage}.to_json
  cache('json:'+url,ret);

  return ret;
end

get '/aff' do
  redirect '/login' unless logged_on?
  @affiliate = affiliate
  haml :aff
end

post '/aff' do
  protected!
  response.set_cookie('affiliate',params[:aff])
  redirect '/'
end

get '/folder' do
  redirect '/login' unless logged_on?
  @folder = folder
  haml :folder
end

post '/folder' do
  protected!
  response.set_cookie('folder',params[:folder])
  redirect '/'
end

post '/csv' do
  protected!

  f = folder.gsub(/\\/,'/')

  begin
    fname = f+'/'+params[:filename]
    open(fname,'w').write(params[:data])
    return { status: 'Success', message: "File was saved as '%s'." % fname}.to_json
  rescue
    return { status: 'Failure', message: "File couldn't be saved." }.to_json
  end
end

get '/login' do
  haml :login
end

post '/login' do
  #expected = Base64.encode64((Digest::SHA1.new << SALT+params['username']).to_s)[12..21]
  #if expected == params['password']
    response.set_cookie('authorized','yes')    
    response.set_cookie('affiliate', 'dummyaffliate')
    redirect '/'
  #else
  #  redirect '/login'
  #end
end

get '/logout' do
  response.set_cookie('authorized', false)
  redirect '/login'
end


Thread.new do
  sleep 1
  Launchy.open('http://localhost:%d' % port)
end unless HEROKU
