package logic

type User struct {
	Id    string
	Name  string
	Phone string
}

var users = map[string]User{
	"1": {
		Id:    "1",
		Name:  "Alice",
		Phone: "1234567890",
	},
	"2": {
		Id:    "2",
		Name:  "Bob",
		Phone: "0987654321",
	},
}
