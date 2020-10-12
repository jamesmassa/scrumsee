class Sprint:
    def __init__(self, id, goal, startdate, enddate):
        self.id = id
        self.goal = goal
        self.startdate = startdate
        self.enddate = enddate

    def __str__(self):
        return 'ID: {self.id} goal: {self.goal} startdate: {self.startdate} enddate: {self.enddate} '.format(self=self)

    def toDict(self):
        sprint = {"id": self.id,
                  "goal": self.goal,
                  "startdate": self.startdate,
                  "enddate": self.enddate}
        return sprint
