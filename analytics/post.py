class Post:
    def __init__(self, id, posttext, displayname, channelname, timestamp):
        self.id = id
        self.posttext = posttext
        self.displayname = displayname
        self.channelname = channelname
        self.timestamp = timestamp

    def __str__(self):
        return 'ID: {self.id} timestamp: {self.timestamp} displayname: {self.displayname} channelname: {self.channelname} timestamp: {self.timestamp}'.format(self=self)

    def toDict(self):
        post = {"id": self.id,
                "posttext": self.posttext,
                "displayname": self.displayname,
                "channelname": self.channelname,
                "timestamp": self.timestamp}
        return post 
