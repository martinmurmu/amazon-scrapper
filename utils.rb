

CACHEDIR = Dir.tmpdir+'/amazoncache'


# useragent string; it's a fairly recent chrome
USERAGENT = 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.17 (KHTML, like Gecko) Ubuntu Chromium/24.0.1312.56 Chrome/24.0.1312.56 Safari/537.17'

def noko(url)
  h = dl(url)
  #h = h.force_encoding('iso-8859-1').encode('utf-8') if url =~ /amazon[.]com[.]/ # amazon.com is still on iso-8859-1 # actually, we can ask it to use utf8: "ie=UTF8"
  Nokogiri::HTML(h, nil, 'UTF-8')
end


def cache(key, value = nil)

  # clean up cache directory every few request
  cache_cleanup if rand(20) == 0

  # come up with a suitable name for the cache file
  fname = (Digest::SHA1.new << key).to_s

  # make sure we have a folder
  fname = CACHEDIR + '/' + fname

  if value
    begin
      FileUtils.mkdir_p CACHEDIR
      open(fname,'w').write(value)
    rescue
      File.delete(fname) if File.exists?(fname) # cleanup
    end
    return value
  else
    return open(fname).read if File.exists?(fname) && File.mtime(fname) >= Time.now - CACHETIME
  end

end



# little utility to download a file or get the cached copy
def dl(url)
  begin
    begin
      s = open(url, "User-Agent" => USERAGENT).read
    rescue
      s = nil
    end
  end until s

  return s
end



def cache_cleanup
  Dir.foreach(CACHEDIR) do |f|
    next if f[0] == '.'
    f = CACHEDIR + '/' + f
    File.delete(f) if (File.mtime(f) < Time.now - CACHETIME) || (File.size(f) == 0)
  end
end
