#include<stdio.h>
#include<unistd.h>
#include<stdlib.h>

int main(int argc, char *argv[])
{
    printf("hello world(pid:%d)\n", getpid()); // 修复拼写错误
    fflush(stdout); // 确保输出立即刷新

    int rc = fork();
    if(rc < 0)// fork failed; exit
    {
        fprintf(stderr, "fork failed\n");
        exit(1);
    }
    else if(rc == 0)// child process
    {
        printf("hello, I am child (pid:%d)\n", getpid());
        fflush(stdout); // 确保子进程输出立即刷新
    }
    else// parent process
    {
        printf("hello, I am parent of %d (pid:%d)\n", rc, getpid());
        fflush(stdout); // 确保父进程输出立即刷新
    }
    return 0;
}